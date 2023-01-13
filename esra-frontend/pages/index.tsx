import { Search } from '@material-ui/icons'
import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { useState } from 'react'
import { SearchComponent } from '../components/search/search-component'

const Home: NextPage = () => {


  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <Head>
        <title>ESRA+</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex w-full flex-1 flex-col items-center justify-center px-5 text-center gap-[30px] sm:mt-[140px]">
        <h1 className="text-8xl font-semibold text-cyan-800">
          ESRA+
        </h1>
        <SearchComponent/>
      </main>

      <footer className="flex h-24 w-full flex-col items-center justify-center border-t-[1px] gap-6">
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
      </footer>
    </div>
  )
}

export default Home
