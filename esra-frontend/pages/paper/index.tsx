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

import { Viewer } from '@react-pdf-viewer/core'; // install this library
// Plugins
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout'; // install this library
// Import the styles
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
// Worker
import { Worker } from '@react-pdf-viewer/core'; // install this library

const PaperPage: NextPage = () => {
  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  const router = useRouter();
  const { query, paperId } = router.query;
  const [notFound, setNotFound] = useState<boolean>(false);
  const [paper, setPaper] = useState<{ [key: string]: any } | undefined>(undefined);
  const [showMinimal, setShowMinimal] = useState(false);
  const [showMinimalBar, setShowMinimalBar] = useState(false);
  const [relatedPapers, setRelatedPapers] = useState<Array<{[key: string]: any}>>([]);
  const [explanation, setExplanation] = useState<[{order: number, sentence: string, value: number}] | null>(null);

  const origin = process.env.NEXT_PUBLIC_DEV_URL ?? (
    typeof window !== 'undefined' && window.location.origin
      ? new URL("api/", window.location.origin).toString()
      : '');

  useEffect(() => {
    console.log(`paper or query changed: ${paperId}, ${query}`);
    setRelatedPapers([]);
    setExplanation(null);
    if (paperId) {
      const PAPER_URL = new URL('paper', origin).toString();
      axios.get(PAPER_URL, { params: { query: query, paperId } })
        .then(response => {
          setPaper({ paperId, ...response.data.result });
          console.log(response.data.result);
          const RELATE_URL = new URL('search', origin).toString();
          axios.get(RELATE_URL, { params: { query: `${query} ${response.data.result['title']}`, limit: 6 } })
            .then(response => {
              const resArr: Array<{[key: string]: any}> = []
              for (const res of response.data.result){
                if (res.paperId === paperId) continue;
                resArr.push(res)
                if (resArr.length >= 5) break;
              }
              setRelatedPapers(resArr);
              console.log(resArr);
            });
        })
        .catch(error => {
          if (error.response.status === 404) {
            setNotFound(true);
          }
          else {
            throw error;
          }
        });
      if (query) {
        const EXPLAIN_URL = new URL('explain', origin).toString();
        axios.get(EXPLAIN_URL, { params: { query: query, paperId: paperId, wait: 45, gen: 1 } }).then(response => {
          setExplanation(response.data.result);
        });
      }
    }
  }, [query, paperId]);

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
        <title>{paperId} - ESRA+ Paper</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={`${showMinimal ? 'fixed' : ''} w-full z-50 h-0 -inset-y-[30px]`}>
        <div className="flex w-full flex-col h-0 items-center px-5 pt-10 justify-start">
          <SearchComponent currPage="search" />
        </div>
      </div>

      <div className="flex w-full h-auto flex-1 flex-col items-center justify-start text-center gap-[30px] absolute z-10">
        <header className="flex items-center w-full h-32 border-b-[1px] border-gray-300">
          <div className={`${showMinimal ? 'fixed inset-y-3 h-0' : 'items-center'} flex justify-center w-1/5 z-50`}>
            <HeadLogo />
          </div>
        </header>

        {
          showMinimalBar ?
            <div className="fixed flex items-center w-full h-[68px] border-b-[1px] border-gray-300 bg-white" /> : null
        }

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
                    {(query !== undefined && paper !== undefined) ? <ResultPaper query={query} result={paper} explanation={explanation} /> : null}
                  </ul>
                </div>
                <div className='flex flex-col w-full max-w-[750px] show-logo:max-w-[300px] items-center gap-3'>
                  <div className='flex flex-row w-full justify-center items-center gap-3'>
                    <Link href={`/paper/read?paperId=${paperId}&query=${query}`} className='flex justify-center items-center h-12 w-full border-[1px] p-3 bg-cyan-800 text-white hover:bg-opacity-80 hover:shadow-md hover:underline'>
                      Read and Chat
                    </Link>
                    <a href={paper ? paper["arxiv"] : ''} target="_blank" className='flex justify-center items-center h-12 w-full border-[1px] p-3 bg-red-800 text-white hover:bg-opacity-80 hover:shadow-md hover:underline'>
                      ArXiv
                    </a>
                  </div>
                  <div className='flex flex-col w-full justify-start items-start p-4 border-[1px] text-start hover:shadow-md'>
                    <h3 className='pb-3'>Related Papers</h3>
                    {
                      relatedPapers && relatedPapers.length > 0 ?
                      relatedPapers.map((res: { [key: string]: any }) => (
                        <Link 
                          href={`/paper?paperId=${res['paperId']}&query=${query} ${res['title']}`}
                          className='p-3 w-full font-semibold text-cyan-800 hover:underline border-t-[1px]'
                        >
                          <h4>
                            {res['title']}
                          </h4>
                        </Link>
                      )) :
                      Array(5).fill(
                        <h4 className='flex flex-col pt-5 p-3 w-full font-semibold text-cyan-800 hover:underline border-t-[1px] gap-2'>
                          <div className='w-11/12 h-4 bg-gray-200 animate-pulse rounded-full' />
                          <div className='w-3/4 h-4 bg-gray-200 animate-pulse rounded-full' />
                          <div className='w-4/5 h-4 bg-gray-200 animate-pulse rounded-full' />
                        </h4>
                      )
                    }
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
