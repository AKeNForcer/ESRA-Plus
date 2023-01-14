import { ExpandLess, ExpandMore, Search } from "@material-ui/icons"
import { FunctionComponent, useState } from "react";



export const RealSearchResultLoading = (props: any) => {
  // const { title, onSubmitClick } = props
  // const handleSubmitClick = () => {
    //   if (!onSubmitClick) return;
    //   onSubmitClick(title);
    // }

  return <>
    <li className='flex flex-col items-center justify-center w-full p-3 border-[1px] gap-3 animate-pulse'>
      <div className='flex w-full font-ligeht'>
        <div className='flex flex-wrap justify-start w-full gap-y-1 gap-x-4 pb-1'>
          <ul className='flex flex-wrap justify-start w-auto gap-1'>
            <li className='flex items-center justify-center px-1.5 h-7 text-xs gap-2'>
              <div className="h-5 w-40 bg-gray-100 rounded-full"></div>
            </li>
          </ul>
        </div>
        <div className='flex items-start justify-center pt-1'>
          <div className='w-6 h-6 text-gray-500'/>
        </div>
      </div>
      <h3 className='flex flex-col items-start justify-start text-left w-full px-1.5 text-base font-semibold pb-3 gap-2'>
        <div className="h-4 w-5/6 bg-gray-200 rounded-full"></div>
        <div className="h-4 w-2/5 bg-gray-200 rounded-full"></div>
      </h3>
    </li>
  </>
}