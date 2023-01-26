import { ExpandLess, ExpandMore, Search } from "@material-ui/icons"
import Link from "next/link";
import { FunctionComponent, useState } from "react";



export const ResultPaper = (props: any) => {
  const { result, query } = props;
  console.log(result);
  return <>
    <li
      className='flex flex-col items-center justify-center w-full p-3 border-[1px] gap-3 hover:shadow-md'
      key={result["paperId"]}
    >
      <div className='flex w-full font-ligeht'>
        <div className='flex flex-wrap justify-start w-full gap-y-1 gap-x-4 pb-1'>
          <ul className='flex flex-wrap justify-start w-auto gap-1'>
            <li className='flex items-center justify-center px-1.5 h-7 text-xs'>authors:</li>
            {
              result["authors"].toString().replaceAll(" and ", ", ").split(", ").map((author: string) => (
                <li className='flex items-center justify-center px-1.5 h-7 rounded-lg border-[1px] text-xs' key={author}>{author}</li>
              ))
            }
          </ul>
          <ul className='flex flex-wrap justify-start w-auto gap-1'>
            <li className='flex items-center justify-center px-1.5 h-7 text-xs'>categories:</li>
            {
              result["categories"].toString().split(" ").map((cat: string) => (
                <li className='flex items-center justify-center px-1.5 h-7 rounded-lg border-[1px] text-xs' key={cat}>{cat}</li>
              ))
            }
          </ul>
          <ul className='flex flex-wrap justify-start w-auto gap-1'>
            <li className='flex items-center justify-center px-1.5 h-7 text-xs'>arXiv ID:</li>
            <li className='flex items-center justify-center px-1.5 h-7 rounded-lg border-[1px] text-xs'>{result["paperId"]}</li>
          </ul>
        </div>
      </div>
      <Link
        href={`/paper?paperId=${result["paperId"]}&query=${query}`}
        className="flex items-center justify-start text-left w-full px-1.5 text-base font-semibold pb-3 text-cyan-900 hover:underline"
      >
        <h3>
          {result['title']}
        </h3>
      </Link>

      <div className='flex flex-col show-logo:flex-row items-start justify-start text-left w-full px-1.5 text-sm pb-1 gap-3'>
        <h5>Abstract:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</h5>
        <p className="font-extralight">
          {result['abstract']}
        </p>
      </div>
      <div className='flex flex-col show-logo:flex-row items-start justify-start text-left w-full px-1.5 text-sm pb-1 gap-3'>
        <h5>Comments:&nbsp;</h5>
        <p className="font-extralight">
          {result['comments']}
        </p>
      </div>
      <div className='flex flex-col show-logo:flex-row items-start justify-start text-left w-full px-1.5 text-sm pb-3 gap-3'>
        <h5>Submitter:&nbsp;&nbsp;&nbsp;</h5>
        <p className="font-extralight">
          {result['submitter']}
        </p>
      </div>
    </li>
  </>
}