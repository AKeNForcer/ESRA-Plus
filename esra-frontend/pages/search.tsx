import axios from 'axios'
import type { NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { RealSearchResult } from '../components/search/real-search-result'
import { RealSearchResultLoading } from '../components/search/real-search-result-loading'
import { SearchComponent } from '../components/search/search-component'
import InfiniteScroll from "react-infinite-scroll-component";
import { HeadLogo } from '../components/head-logo'
import { ExpandMore } from '@material-ui/icons'

const SearchPage: NextPage = () => {
  const router = useRouter();
  const { query } = router.query;
  const [realSearchResult, setRealSearchResult] = useState<Array<{ [key: string]: any }>>([]);
  const [hasMore, setHasMore] = useState(false);
  const [showMinimal, setShowMinimal] = useState(false);
  const [showMinimalBar, setShowMinimalBar] = useState(false);
  const [sortBy, setSortBy] = useState("RELEVANCE");

  const origin = process.env.NEXT_PUBLIC_DEV_URL ?? (
    typeof window !== 'undefined' && window.location.origin
    ? new URL("api/", window.location.origin).toString()
    : '' );

  const NEXT_PUBLIC_TOTAL_RESULT_LIMIT = parseInt(process.env.NEXT_PUBLIC_TOTAL_RESULT_LIMIT ?? '100');

  useEffect(() => {
    console.log(`query changed: ${query}`);
    if (query){
      setRealSearchResult([]);
      const SEARCH_URL = new URL('search', origin).toString();
      axios.get(SEARCH_URL, { params: { query: query, limit: process.env.NEXT_PUBLIC_INITIAL_RESULT_LIMIT, sort: sortBy } }).then(response => {
        setRealSearchResult(response.data.result);
        setHasMore(true);
      });
    }
  }, [query, sortBy]);

  const loadMore = async () => {
    if (query){
      const SEARCH_URL = new URL('search', origin).toString();
      axios.get(SEARCH_URL, { params: { query: query, limit: process.env.NEXT_PUBLIC_INCREMENT_RESULT_LIMIT, skip: realSearchResult.length } }).then(response => {
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-first">
      <Head>
        <title>ESRA+ search result</title>
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
                  className='flex items-center text-center justify-center h-7 w-28 border-[1px] border-gray-300'
                  onChange={(event) => setSortBy(event.target.value)}>
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
                    realSearchResult.map((res) => <RealSearchResult query={query} result={res} key={res["paperId"]}/>) :
                    Array(NEXT_PUBLIC_TOTAL_RESULT_LIMIT).fill(<RealSearchResultLoading/>)
                  }
                </ul>
              </InfiniteScroll> :
              null
            }
          </div>
          <div className='flex flex-col w-full max-w-[750px] show-logo:max-w-[500px] items-center gap-3'>
            <div className='flex flex-col w-full justify-start text-start p-4 border-[1px]'>
              <h3>Overview</h3>
              <p className='p-2 font-extralight text-sm'>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                This paper describes the design and development of low cost USB Data Acquisition System (DAS) for the measurement of physical parameters. Physical parameters such as temperature, humidity, light intensity etc., which are generally slowly varying signals are sensed by respective sensors or integrated sensors and converted into voltages. The DAS is designed using PIC18F4550 microcontroller, communicating with Personal Computer (PC) through USB (Universal Serial Bus). The designed DAS has been tested with the application program developed in Visual Basic, which allows online monitoring in graphical as well as numerical display.
              </p>
            </div>
            <div className='flex w-full h-24 justify-start p-3 border-[1px]'>
              Fact list
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default SearchPage
