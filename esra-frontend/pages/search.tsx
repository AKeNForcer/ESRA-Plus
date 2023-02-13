import axios, { AxiosResponse } from 'axios'
import type { NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { RealSearchResult } from '../components/search/real-search-result'
import { RealSearchResultLoading } from '../components/search/real-search-result-loading'
import { SearchComponent } from '../components/search/search-component'
import InfiniteScroll from "react-infinite-scroll-component";
import { HeadLogo } from '../components/head-logo'
import { ExpandMore } from '@material-ui/icons'
import Link from 'next/link'
const Mutex = require("async-mutex").Mutex;

const SearchPage: NextPage = () => {
  const router = useRouter();
  const { query } = router.query;
  const sortBy = (["RELEVANCE", "NEWEST", "OLDEST"] as Array<string | string[] | undefined>).includes(router.query.sort) ? router.query.sort : "RELEVANCE" 
  const [realSearchResult, setRealSearchResult] = useState<Array<{ [key: string]: any }>>([]);
  const [hasMore, setHasMore] = useState(false);
  const [showMinimal, setShowMinimal] = useState(false);
  const [showMinimalBar, setShowMinimalBar] = useState(false);
  const [explanation, setExplanation] = useState<{ [key: string]: any }>({});
  const [getExplainIdle, setGetExplainIdle] = useState<boolean>(true);
  const [getExplainIdleProbe, setGetExplainIdleProbe] = useState<boolean>(true);
  const [found409, setFound409] = useState<boolean>(false);
  const [overview, setOverview] = useState<string| null>(null);
  const [question, setQuestion] = useState<[string]| null>(null);
  
  const origin = process.env.NEXT_PUBLIC_DEV_URL ?? (
    typeof window !== 'undefined' && window.location.origin
    ? new URL("api/", window.location.origin).toString()
    : '' );

  const NEXT_PUBLIC_TOTAL_RESULT_LIMIT = parseInt(process.env.NEXT_PUBLIC_TOTAL_RESULT_LIMIT ?? '100');
  const mutex = useRef(new Mutex());

  const getExplanation = async (idx: number, initial_query: string, explanation: { [key: string]: any }) => {
    if (query !== initial_query) return;
    setGetExplainIdleProbe(false);
    if (idx >= realSearchResult.length) {
      setGetExplainIdleProbe(true);
      console.log("get explain stopped", realSearchResult.length);
      return;
    }
    const EXPLAIN_URL = new URL('explain', origin).toString();
    const setExplain = (response: AxiosResponse<any, any>, i: number) => {
      explanation[`${realSearchResult[i].paperId}`] = [...response.data.result];
      console.log(i, "set explanation", realSearchResult[i].paperId)
      setExplanation({...explanation});
    }
    const trig409 = () => {
      setFound409(true);
    }
    if (!explanation[realSearchResult[idx].paperId]) {
      explanation[realSearchResult[idx].paperId] = null;
      setExplanation({...explanation});
      console.log(idx, "send explanation request:", realSearchResult[idx].paperId);
      axios.get(EXPLAIN_URL, { params: { query: query, paperId: realSearchResult[idx]['paperId'], wait: 45, gen: 1 } }).then(response => {
        if (query !== initial_query) return;
        mutex.current.runExclusive(async function () {
          setExplain(response, idx);
          if (idx+1 >= realSearchResult.length || explanation[realSearchResult[idx+1].paperId]) {
            console.log("get explain stopped #0", realSearchResult.length, Object.keys(explanation).length, getExplainIdleProbe);
            setGetExplainIdleProbe(true);
          }
        });
      }).catch((error) =>{
        if (error.status === 409) trig409();
        else throw error;
      });
    }
    if (idx+1 < realSearchResult.length) {
      if (!explanation[realSearchResult[idx+1].paperId]) {
        explanation[realSearchResult[idx+1].paperId] = null;
        setExplanation({...explanation});
        console.log(idx+1, "send explanation request:", realSearchResult[idx+1].paperId);
        axios.get(EXPLAIN_URL, { params: { query: query, paperId: realSearchResult[idx+1]['paperId'], wait: 45, gen: 1 } }).then(response => {
          if (query !== initial_query) return;
          mutex.current.runExclusive(async function () {
            setExplain(response, idx+1);
            if (explanation[realSearchResult[idx].paperId]) {
              console.log("get explain stopped #1", realSearchResult.length, Object.keys(explanation).length, getExplainIdleProbe);
              setGetExplainIdleProbe(true);
            }
          });
        }).catch((error) =>{
          if (error.response.status === 409 ||
              error.response.status === 503) trig409();
          else throw error;
        });;
      } else {
        console.log("get explain stopped #2", realSearchResult.length, Object.keys(explanation).length, getExplainIdleProbe);
        setGetExplainIdleProbe(true);
      }
    } else {
      console.log("get explain stopped $", realSearchResult.length);
      setGetExplainIdleProbe(true);
    }
  }

  useEffect(() => {
    if (getExplainIdleProbe) {
      console.log(getExplainIdleProbe, realSearchResult.length, Object.keys(explanation).length)
      if (realSearchResult.length > Object.keys(explanation).length) {
        setGetExplainIdle(!getExplainIdle);
      }
    }
  }, [getExplainIdleProbe])

  useEffect(() => {
    if (getExplainIdleProbe) {
      for (let i=0; i<realSearchResult.length; i++) {
        if (explanation[realSearchResult[i].paperId] === undefined) {
          getExplanation(i, query as string, {...explanation});
          break
        }
      }
    }
  }, [getExplainIdle])

  useEffect(() => {
    console.log("real search result change", getExplainIdle);
    if (getExplainIdleProbe) setGetExplainIdle(!getExplainIdle);
  }, [realSearchResult]);

  useEffect(() => {
    console.log(`query changed: ${query}`);
    if (query){
      setRealSearchResult([]);
      setHasMore(false);
      setOverview(null);
      setQuestion(null);
      const SEARCH_URL = new URL('search', origin).toString();
      axios.get(SEARCH_URL, { params: { query: query, limit: process.env.NEXT_PUBLIC_INITIAL_RESULT_LIMIT, sort: sortBy } }).then(async response => {
        setRealSearchResult(response.data.result);
        setHasMore(true);
        console.log("get overview");
        const OVERVIEW_URL = new URL('explain/overview', origin).toString();
        axios.get(OVERVIEW_URL, { params: { query: query, wait: 45, gen: 1 } }).then(async response => {
          setOverview(response.data.result);
        });
        console.log("get question");
        const QUESTION_URL = new URL('explain/question', origin).toString();
        axios.get(QUESTION_URL, { params: { query: query, wait: 45, gen: 1 } }).then(async response => {
          setQuestion(response.data.result);
          console.log('question', response.data.result);
        });
      });
    }
  }, [query, sortBy]);

  const loadMore = async () => {
    if (query){
      const SEARCH_URL = new URL('search', origin).toString();
      axios.get(SEARCH_URL, { params: { query: query, limit: process.env.NEXT_PUBLIC_INCREMENT_RESULT_LIMIT, skip: realSearchResult.length, sort: sortBy } }).then(async response => {
        const newRes = [...realSearchResult, ...response.data.result];
        if (newRes.length >= NEXT_PUBLIC_TOTAL_RESULT_LIMIT) {
          setHasMore(false);
        }
        setRealSearchResult(newRes);
      });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowMinimal(window.scrollY > 30);
      setShowMinimalBar(window.scrollY > 60);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const retryLoadExplaination = () => {
    console.log("retry")
    setGetExplainIdle(!getExplainIdle);
    setFound409(false);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-first">
      <Head>
        <title>{query} - ESRA+ search</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={`${showMinimal ? 'fixed' : ''} w-full z-50 h-0 -inset-y-[30px]`}>
        <div className="flex w-full flex-col h-0 items-center px-5 pt-10 justify-start">
          <SearchComponent currPage="search"/> 
        </div>
      </div>

      <div className="flex w-full h-auto flex-1 flex-col items-center justify-start text-center gap-[30px] absolute z-10">
        <header className="flex items-center w-full h-32 border-b-[1px] border-gray-300">
          <div className={`${showMinimal ? 'fixed inset-y-3 h-0' : 'items-center'} flex justify-center w-1/5 z-50`}>
            <HeadLogo/>
          </div>
        </header>

        {
          showMinimalBar ?
          <div className="fixed flex items-center w-full h-[68px] border-b-[1px] border-gray-300 bg-white"/> : null
        }

        <main className='flex flex-col-reverse show-logo:flex-row w-full items-center show-logo:items-start justify-center text-gray-600 px-5 gap-5 py-4'>
          <div className='flex flex-col w-full max-w-[750px] items-start gap-3 pt-5 show-logo:pt-0'>
            <div className='flex items-start justify-start w-full text-sm'>
              <div className='text-start w-full'>
                <h2 className='font-extralight'>Search Result of <mark className='text-cyan-800 font-semibold bg-transparent'>{query}</mark></h2>
              </div>
              <div className='flex items-center justify-end w-[250px] gap-1 text-xs'>
                <p className=''>
                  Sort by:
                </p>
                <select 
                  value={sortBy}
                  className='flex items-center text-center justify-center h-7 w-28 border-[1px] border-gray-300'
                  onChange={(event) => router.replace(`/search?query=${query}&sort=${event.target.value}`)}>
                  <option value="RELEVANCE">Most relevant</option>
                  <option value="NEWEST">Most recent</option>
                  <option value="OLDEST">Least recent</option>
                </select>
              </div>
            </div>
            {
              realSearchResult ?
              <InfiniteScroll
                dataLength={realSearchResult.length}
                next={loadMore}
                hasMore={hasMore}
                loader={<h4 className='flex items-center justify-center w-full p-3'>Loading...</h4>}
                endMessage={<div className='w-full h-12'/>}
                className='flex flex-col items-center justify-center w-full'
              >
                <ul className='flex flex-col items-center justify-center w-full gap-3'>
                  { realSearchResult.length > 0?
                    realSearchResult.map((res) => <RealSearchResult 
                      query={query} 
                      result={res} 
                      key={res["paperId"]} 
                      explanation={explanation[res['paperId']]} 
                      found409={found409} 
                      tryAgainCallback={retryLoadExplaination}/>) :
                    Array(NEXT_PUBLIC_TOTAL_RESULT_LIMIT).fill(<RealSearchResultLoading/>)
                  }
                </ul>
              </InfiniteScroll> :
              null
            }
          </div>
          <div className='flex flex-col w-full max-w-[750px] show-logo:max-w-[500px] items-center gap-3'>
            <div className='flex w-full h-24 justify-start p-3 border-[1px]'>
              Fact list
            </div>
            <div className='flex flex-col w-full justify-start text-start p-4 border-[1px]'>
              <h3>Overview</h3>
              {
                overview ? <p className='p-2 font-extralight text-sm'>
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  {overview}
                </p> : 
                <div className="flex w-full animate-pulse">
                  <h3 className='flex flex-col items-start justify-start text-left w-full px-1.5 text-base font-semibold pt-1.5 gap-2'>
                    <div className="h-3 w-full bg-gray-200 rounded-full"></div>
                    <div className="h-3 w-10/12 bg-gray-200 rounded-full"></div>
                    <div className="h-3 w-11/12 bg-gray-200 rounded-full"></div>
                    <div className="h-3 w-full bg-gray-200 rounded-full"></div>
                    <div className="h-3 w-10/12 bg-gray-200 rounded-full"></div>
                    <div className="h-3 w-9/12 bg-gray-200 rounded-full"></div>
                    <div className="h-3 w-11/12 bg-gray-200 rounded-full"></div>
                    <div className="h-3 w-10/12 bg-gray-200 rounded-full"></div>
                    <div className="h-3 w-11/12 bg-gray-200 rounded-full"></div>
                    <div className="h-3 w-1/3 bg-gray-200 rounded-full"></div>
                  </h3>
                </div>
              }
            </div>
            <div className='flex flex-col w-full justify-start text-start p-4 border-[1px]'>
              <h3>Related queries</h3>
              {
                question ? 
                <ul className='flex flex-wrap justify-start w-auto gap-1 mt-3'>
                  {question.map(
                    (e) => <Link href={`/search?query=${e}`} key={e}>
                      <div className='flex items-center justify-center px-1.5 h-7 rounded-lg border-[1px] text-xs hover:underline'>{e}</div>
                    </Link>
                  )} 
                </ul> : null

              }
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default SearchPage
