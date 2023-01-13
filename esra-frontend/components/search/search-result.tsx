import { Search } from "@material-ui/icons"
import { FunctionComponent, useState } from "react";



export const SearchResult = (props: any) => {
  const { title } = props
  const tst = () => {
    console.log("tsa rassa fa")
  }

  return <div className="w-full hover:bg-gray-50" onClick={tst}>
    <div className="flex my-1.5">
      <Search className='ml-3'/>
      <p className='ml-3 mx-5 text-gray-600 w-fullfocus:outline-none bg-transparent'>{title}</p>
    </div>
  </div>
}