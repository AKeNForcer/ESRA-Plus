import axios from 'axios'
import type { NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { RealSearchResult } from '../../components/search/real-search-result'
import { RealSearchResultLoading } from '../../components/search/real-search-result-loading'
import { SearchComponent } from '../../components/search/search-component'
import InfiniteScroll from "react-infinite-scroll-component";
import { ResultPaper } from '../../components/paper/result-paper'
import Link from 'next/link'
import { HeadLogo } from '../../components/head-logo'

const PaperPage: NextPage = () => {
  const router = useRouter();
  const { query, paperId } = router.query;
  const [notFound, setNotFound] = useState<boolean>(false);
  const [paper, setPaper] = useState<{ [key: string]: any } | undefined>(undefined);

  const origin = process.env.NEXT_PUBLIC_DEV_URL ?? (
    typeof window !== 'undefined' && window.location.origin
      ? new URL("api/", window.location.origin).toString()
      : '');

  useEffect(() => {
    console.log(`paper or query changed: ${paperId}, ${query}`);
    if (paperId) {
      const PAPER_URL = new URL('paper', origin).toString();
      axios.get(PAPER_URL, { params: { query: query, paperId } })
        .then(response => {
          setPaper({paperId, ...response.data.result});
          console.log(response.data.result);
        })
        .catch(error => {
          if (error.response.status === 404) {
            setNotFound(true);
          }
          else {
            throw error;
          }
        });
    }
  }, [query, paperId]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-first">
      <Head>
        <title>{paperId}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex w-full flex-col items-center px-5 pt-10 justify-start">
        <SearchComponent currPage="search" />
      </div>

      <div className="flex w-full h-auto flex-1 flex-col items-center justify-start text-center gap-[30px] absolute z-10">
        <header className="flex items-center w-full h-32 border-b-[1px] border-gray-300">
          <div className='flex items-center justify-center h-full w-1/5'>
            <HeadLogo />
          </div>
        </header>

        <main className='flex flex-col show-logo:flex-row w-full items-center show-logo:items-start justify-center text-gray-600 px-5 gap-5 py-4'>
          {
            notFound ?
            <div className='flex flex-col w-full gap-10 py-20'>
              <h2 className='text-9xl font-light text-gray-300'>404</h2>
              <h3 className='text-gray-400'>
                Paper '{paperId}' is not found in our database right now!
              </h3>
            </div> :
            <>
              <div className='flex flex-col w-full max-w-[750px] show-logo:max-w-[950px] items-center gap-3 pt-5 show-logo:pt-0'>
                <ul className='flex flex-col items-center justify-center w-full gap-3'>
                  { (query !== undefined && paper !== undefined) ? <ResultPaper query={query} result={paper}/> : null }
                </ul>
              </div>
              <div className='flex flex-col w-full max-w-[750px] show-logo:max-w-[300px] items-center gap-3'>
                <div className='flex flex-row w-full justify-center items-center gap-3'>
                  <a href={paper ? paper["pdf"] : ''} target="_blank" className='flex justify-center items-center h-12 w-full border-[1px] p-3 bg-cyan-800 text-white hover:bg-opacity-80 hover:shadow-md'>
                    PDF
                  </a>
                  <a href={paper ? paper["arxiv"] : ''} target="_blank" className='flex justify-center items-center h-12 w-full border-[1px] p-3 bg-red-800 text-white hover:bg-opacity-80 hover:shadow-md'>
                    ArXiv
                  </a>
                </div>
                <div className='flex flex-col w-full justify-start items-start p-3 border-[1px] text-start hover:shadow-md'>
                  <h3 className='pl-1 pb-3'>Related Papers</h3>
                  <Link href={`/google`}>
                    <div>

                    </div>
                    <h4 className='mx-2 p-3 font-semibold text-cyan-900 hover:underline border-t-[1px]'>
                      Learning Deformable Object Manipulation from Expert Demonstrations
                    </h4>
                    <h4 className='mx-2 p-3 font-semibold text-cyan-900 hover:underline border-t-[1px]'>
                      Comparison of Speech Activity Detection Techniques for Speaker Recognition
                    </h4>
                    <h4 className='mx-2 p-3 font-semibold text-cyan-900 hover:underline border-t-[1px]'>
                      Worst-case Throughput Analysis for Parametric Rate and Parametric Actor Execution Time Scenario-Aware Dataflow Graphs
                    </h4>
                    <h4 className='mx-2 p-3 font-semibold text-cyan-900 hover:underline border-t-[1px]'>
                      Learning Deformable Object Manipulation from Expert Demonstrations
                    </h4>
                    <h4 className='mx-2 p-3 font-semibold text-cyan-900 hover:underline border-t-[1px]'>
                      Comparison of Speech Activity Detection Techniques for Speaker Recognition
                    </h4>
                  </Link>
                </div>
              </div>
            </>
          }
        </main>
      </div>
    </div>
  )
}

export default PaperPage
