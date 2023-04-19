import { Search } from '@material-ui/icons'
import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { SearchComponent } from '../components/search/search-component'

const Home: NextPage = () => {


  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <Head>
        <title>About ESRA+</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className='flex w-full h-full flex-col items-end justify-start z-10 absolute text-gray-500 text-sm'>
        <div className='flex flex-row items-center justify-end w-full pt-6 pr-9 hover:underline hover:text-cyan-800'>
          <Link href='/'>
            Back
          </Link>
        </div>
      </div>

      <main className="flex w-full show-logo:w-2/3 flex-1 flex-col items-center justify-start px-5 text-center gap-[30px] mt-[100px]">
        {/* <h1 className="text-8xl font-semibold text-cyan-800">
          <Link href='/'>
            ESRA+
          </Link>
        </h1> */}
        <div className='flex flex-col items-center justify-start w-full text-gray-600 p-8 border-[1px] gap-8 font-light'>
          <div className='flex flex-col items-start justify-start w-full'>
            <h2 className='text-cyan-800 text-start font-semibold text-2xl mb-3'>About ESRA+</h2>
            <p className='text-start'>
              Explainable Scientific Research Assistant Plus (ESRA+) is a literature discovery platform that augments search results with relevant details with explanations that aid users in understanding more about their queries, and also gives an overview and fact lists related to the query.
            </p>
          </div>
          <div className='flex flex-col items-start justify-start w-full'>
            <h2 className='text-cyan-800 text-start font-semibold text-2xl mb-3'>Features</h2>
            <p className='text-start'>
              Explainable Scientific Research Assistant Plus (ESRA+) provides 6 main features which are
            </p>
            <ul className='text-start list-disc pl-10'>
              <li key='Search' className='list-item'>
                <marker className='font-semibold'>Search</marker>&nbsp;
                User can search by queries semantically and can do both semantic search and string matching.
              </li>
              <li key='Explain' className='list-item'>
                <marker className='font-semibold'>Explain</marker>&nbsp;
                The explanation of each search result and how the result is selected related to the query.
              </li>
              <li key='Overview' className='list-item'>
                <marker className='font-semibold'>Overview</marker>&nbsp;
                Overview helps users to understand more about the definition of the entity related to the query. The overview can also help users understand their queries quicker and better without having to click on each paper.
              </li>
              <li key='Fact lists' className='list-item'>
                <marker className='font-semibold'>Fact lists</marker>&nbsp;
                Show the most relevant facts of papers in search results.
              </li>
              <li key='Related queries' className='list-item'>
                <marker className='font-semibold'>Related queries</marker>&nbsp;
                Recommend queries that are related to the query and papers in search results.
              </li>
              <li key='Related papers' className='list-item'>
                <marker className='font-semibold'>Related papers</marker>&nbsp;
                Recommend papers that are related to the query and the paper that the user just clicked.
              </li>
            </ul>
          </div>
          <div className='flex flex-col items-start justify-start w-full'>
            <h2 className='text-cyan-800 text-start font-semibold text-2xl mb-3'>Main Contributors</h2>
            {/* <p className='text-start'>
              We are extremely thankful to everyone who contributes to the project, supports or provides helpful suggestions. We greatly appreciate the help from:
            </p> */}
            <ul className='text-start list-disc pl-10'>
              <li key='Team' className='list-item'>
                <marker className='font-semibold'>Panithi Vanasirikul</marker>&nbsp;
              </li>
              <li key='Put' className='list-item'>
                <marker className='font-semibold'>Puttinart Puapisit</marker>&nbsp;
              </li>
              <li key='Non' className='list-item'>
                <marker className='font-semibold'>Piyanon Charoenpoonpanich</marker>&nbsp;
              </li>
            </ul>
          </div>
          <div className='flex flex-col items-start justify-start w-full'>
            <h2 className='text-cyan-800 text-start font-semibold text-2xl mb-3'>Acknowledgements</h2>
            <p className='text-start'>
              We are extremely thankful to everyone who contributes to the project, supports or provides helpful suggestions. We greatly appreciate the help from:
            </p>
            <ul className='text-start list-disc pl-10'>
              <li key='Karin' className='list-item'>
                <marker className='font-semibold'>Karin Huangsuwan</marker>&nbsp;
                for his comment.
              </li>
              <li key='Peerapon' className='list-item'>
                <marker className='font-semibold'>Assoc. Prof. Dr. Peerapon Vateekul</marker>&nbsp;
                for his supervision, careful monitoring throughout the project.
              </li>
              <li key='Nvidia' className='list-item'>
                <marker className='font-semibold'>Aik Beng Ng, Timothy Liu and Simon See</marker>&nbsp;
                from NVIDIA team for many good advices during the monthly discussions as well as the computing resources support.
              </li>
              <li key='Duangdao' className='list-item'>
                <marker className='font-semibold'>Dr. Duangdao Wichadakul</marker>&nbsp;
                for suggestions and guidance.
              </li>
              <li key='Krerk' className='list-item'>
                <marker className='font-semibold'>Assoc. Prof. Dr. Krerk Piromsopa</marker>&nbsp;
                for providing Chulalongkorn’s server and domain name.
              </li>
            </ul>
          </div>
        </div>
        <div>

        </div>
      </main>

      {/* <footer className="flex h-24 w-full flex-col items-center justify-center border-t-[1px] gap-6">
        <h2 className='text-cyan-800 text-gray-600 text-sm'>
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

export default Home
