import { Search } from "@material-ui/icons"
import { FunctionComponent, useState } from "react";
import { SearchResult } from "./search-result";
import axios from 'axios';

// const COMPLETE_URL = new URL("complete", NEXT_PUBLIC_BACKEND_URL).toString();


export const SearchComponent = () => {
  const [query, setQuery] = useState("");
  const [completion, setCompletion] = useState<string[]>([]);

  const handleQuery = (event: any) => {
    const newQuery = event.target.value;
    setQuery(newQuery);
    const COMPLETE_URL = new URL("complete", process.env.NEXT_PUBLIC_BACKEND_URL).toString();
    console.log(COMPLETE_URL);
    // if (newQuery.length > 0) {
    //   axios.get(COMPLETE_URL, { params: { query: newQuery } }).then(response => {
    //     console.log(response.data);
    //   });
    // }
    if (newQuery.length == 0) {
      setCompletion([]);
    } else {
      setCompletion(["test test", "test2"]);
    }
  }

  return <>
    <div className='h-[400px] w-full max-w-[700px] text-base'> {/*absolute inset-y-[345px]  z-20*/}
      <div className="flex h-12 w-full items-center rounded-3xl border-[1px] border-gray-300 text-gray-400 relative z-20">
        <Search className='ml-3'/>
        <input className='ml-3 mx-5 text-gray-600 w-full focus:outline-none bg-transparent' type="text" onChange={handleQuery} />
      </div>
      {
        completion.length > 0 ?
          <div className="flex flex-col h-full w-auto items-start pt-[55px] rounded-3xl border-[1px] border-gray-300 text-gray-400 shadow-md text-left relative -inset-y-[48px] z-10">
            {completion.map((title) => <SearchResult title={title} />)}
          </div> :
          null
      }
    </div>
    {/* <div className='h-[400px] w-full max-w-[700px] bg-red-200'></div> */}
  </>
}