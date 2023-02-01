import { ExpandLess, ExpandMore, Search } from "@material-ui/icons"
import Link from "next/link";
import { FunctionComponent, useState } from "react";



export const RealSearchResult = (props: any) => {
  const { result, query } = props;
  
  const [isExpand, setIsExpand] = useState(false);

  return <>
    <li
      className='flex flex-col items-center justify-center w-full p-3 border-[1px] gap-3 hover:shadow-md'
      key={result["paperId"]}
    >
      <div className='flex w-full font-ligeht'>
        <div className='flex flex-wrap justify-start w-full gap-y-1 gap-x-4 pb-1'>
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
          {
            isExpand ?
            <ul className='flex flex-wrap justify-start w-auto gap-1'>
              <li className='flex items-center justify-center px-1.5 h-7 text-xs'>authors:</li>
              {
                result["authors"].toString().replaceAll(" and ", ", ").split(", ").map((author: string) => (
                  <li className='flex items-center justify-center px-1.5 h-7 rounded-lg border-[1px] text-xs' key={author}>{author}</li>
                ))
              }
            </ul> : null
          }
        </div>
        <div className='flex items-start justify-center pt-1'>
          <button className='w-6 h-6 text-gray-500' onClick={() => setIsExpand(!isExpand)}>
            {isExpand ? <ExpandLess /> : <ExpandMore />}
          </button>
        </div>
      </div>
      <Link
        href={`/paper?paperId=${result["paperId"]}&query=${query}`}
        className="flex items-center justify-start text-left w-full px-1.5 text-base font-semibold pb-3 text-cyan-800 hover:underline"
      >
        <h3>
          {result['title']}
        </h3>
      </Link>
      <div className='flex flex-col show-logo:flex-row items-start justify-center text-left w-full px-1.5 text-sm pb-3 gap-3'>
        <h5>Explaination:</h5>
        <p className="font-extralight">
          {
            (() => {
              const res: [string] = result['abstract'].split(" ");
              return <>
                {
                  res.slice(0, Math.min(res.length, isExpand ? res.length : 50))
                    .join(" ") + 
                    ((!isExpand) && res.length > 50 ? " ... " : "")
                }
                {
                  (!isExpand) && res.length > 50 ?
                  <a className="text-cyan-800 font-normal hover:underline hover:cursor-pointer" onClick={() => setIsExpand(true)}>
                    more
                  </a> : null
                }
              </>;
            })()
          }
        </p>
      </div>
      {
        isExpand ?
          <>
            <div className='flex flex-col show-logo:flex-row items-start justify-center text-left w-full px-1.5 text-sm pb-3 gap-3'>
              <h5>Abstract:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</h5>
              <p className="font-extralight">
                {result['abstract']}
              </p>
            </div>
          </> : null
      }
    </li>
  </>
}