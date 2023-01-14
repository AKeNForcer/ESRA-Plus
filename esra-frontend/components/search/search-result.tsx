import { Search } from "@material-ui/icons"
import { FunctionComponent, useState } from "react";



export const SearchResult = (props: any) => {
  const { title, onSubmitClick } = props
  const handleSubmitClick = () => {
    if (!onSubmitClick) return;
    console.log(title);
    onSubmitClick(title);
  }

  return <li className="w-full hover:bg-gray-100" onClick={handleSubmitClick}>
    <div className="flex my-1.5">
      <Search className='ml-3'/>
      <p className='ml-3 mx-5 text-gray-600 w-fullfocus:outline-none bg-transparent'>{title}</p>
    </div>
  </li>
}