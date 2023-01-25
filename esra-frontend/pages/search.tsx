import axios from 'axios'
import type { NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { RealSearchResult } from '../components/search/real-search-result'
import { RealSearchResultLoading } from '../components/search/real-search-result-loading'
import { SearchComponent } from '../components/search/search-component'
import InfiniteScroll from "react-infinite-scroll-component";

const SearchPage: NextPage = () => {
  const router = useRouter();
  const { query } = router.query;
  const [realSearchResult, setRealSearchResult] = useState<Array<{ [key: string]: any }>>([]);
  const [hasMore, setHasMore] = useState(false);

  const origin = process.env.NEXT_PUBLIC_DEV_URL ?? (
    typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : '' );

  const NEXT_PUBLIC_TOTAL_RESULT_LIMIT = parseInt(process.env.NEXT_PUBLIC_TOTAL_RESULT_LIMIT ?? '100');

  useEffect(() => {
    console.log(`query changed: ${query}`);
    if (query){
      setRealSearchResult([]);
      const SEARCH_URL = new URL("/api/search", origin).toString();
      axios.get(SEARCH_URL, { params: { query: query, limit: process.env.NEXT_PUBLIC_INITIAL_RESULT_LIMIT } }).then(response => {
        setRealSearchResult(response.data.result);
        setHasMore(true);
      });
    }
  }, [query]);

  const loadMore = async () => {
    if (query){
      const SEARCH_URL = new URL("/api/search", origin).toString();
      axios.get(SEARCH_URL, { params: { query: query, limit: process.env.NEXT_PUBLIC_INCREMENT_RESULT_LIMIT, skip: realSearchResult.length } }).then(response => {
        const newRes = [...realSearchResult, ...response.data.result];
        if (newRes.length >= NEXT_PUBLIC_TOTAL_RESULT_LIMIT) {
          setHasMore(false);
        }
        setRealSearchResult(newRes);
      });
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-first">
      <Head>
        <title>ESRA+ search result</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex w-full flex-col items-center px-5 pt-10 justify-start">
        <SearchComponent currPage="search"/> 
      </div>

      <div className="flex w-full h-auto flex-1 flex-col items-center justify-start text-center gap-[30px] absolute z-10">
        <header className="flex items-center w-full h-32 border-b-[1px] border-gray-300">
          <div className='flex items-center justify-center h-full w-1/5'>
            <button onClick={() => {router.push(`/`)}}>
              <h1 className="text-5xl font-semibold text-cyan-800 invisible show-logo:visible">
                ESRA+
              </h1> 
            </button>
          </div>
        </header>

        <main className='flex flex-col-reverse show-logo:flex-row w-full items-center show-logo:items-start justify-center text-gray-600 px-5 gap-5 py-4'>
          <div className='flex flex-col w-full max-w-[750px] items-center gap-3 pt-5 show-logo:pt-0'>
            {/* <p>Search results</p> */}
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
                {/* <li className='flex items-center justify-center w-full p-3'>more</li> */}
              </ul>
            </InfiniteScroll>
          </div>
          <div className='flex flex-col w-full max-w-[750px] show-logo:max-w-[500px] items-center gap-5'>
            <div className='flex w-full h-24 justify-start p-3 border-[1px]'>
              Overview
            </div>
            <div className='flex w-full h-24 justify-start p-3 border-[1px]'>
              Fact list
            </div>
          </div>
        </main>
      </div>

      {/* <footer className="flex h-24 w-full flex-col items-center justify-center border-t-[1px] gap-6">
        <h2 className='text-gray-600 text-sm'>
          Explainable Scientific Research Assistant Plus
        </h2>
        <div  className="flex items-center justify-center gap-10">
          <div
            className="flex items-center justify-center gap-4 text-gray-600 text-xs"
          >
            Powered by{' '}
            <Image src="/chulaeng.png" alt="Chula Engineering Logo" width={135} height={1} />{' '}
            <Image src="/nvidia.svg" alt="NVIDIA Logo" width={90} height={1} />
          </div>
        </div>
      </footer> */}
    </div>
  )
}

export default SearchPage
