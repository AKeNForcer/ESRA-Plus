import { Search } from "@material-ui/icons"
import { FunctionComponent, useState } from "react";
import { SearchResult } from "./search-result";
import axios from 'axios';


export const SearchComponent = () => {
  const [query, setQuery] = useState("");
  const [completion, setCompletion] = useState<Array<{[key: string]: any}>>([]);

  const handleQuery = (event: any) => {
    const newQuery = event.target.value;
    setQuery(newQuery);
    const COMPLETE_URL = new URL("/search/complete", process.env.NEXT_PUBLIC_BACKEND_URL).toString();
    if (newQuery.length > 0) {
      axios.get(COMPLETE_URL, { params: { query: newQuery } }).then(response => {
        setCompletion(response.data.result);
      });
    } else {
      setCompletion([]);
    }

    // if (newQuery.length == 0) {
    //   setCompletion([]);
    // } else {
    //   setCompletion([
    //     {
    //       "detail": null,
    //       "paperId": "2209.07244",
    //       "rank": 1,
    //       "score": 13900236,
    //       "title": "Linear Transformations for Cross-lingual Sentiment Analysis sddlsdld slsdl lds ldsa l l d d s s ssd"
    //     },
    //     {
    //         "detail": null,
    //         "paperId": "1908.06121",
    //         "rank": 2,
    //         "score": 13537011,
    //         "title": "CFO: A Framework for Building Production NLP Systems"
    //     }
    //   ]);
    // }
  }

  return <>
    <div className='h-[400px] w-full max-w-[700px] text-base'> {/*absolute inset-y-[345px]  z-20*/}
      <div className="flex h-12 w-full items-center bg-white rounded-3xl border-[1px] border-gray-300 text-gray-400 relative z-20">
        <Search className='ml-3'/>
        <input className='ml-3 mx-5 text-gray-600 w-full focus:outline-none bg-transparent' type="text" onChange={handleQuery} />
      </div>
      {
        completion.length > 0 ?
          <ul className="flex flex-col h-auto max-h-[600px] w-full short:max-h-[360px] rxs:max-h-[480px] overflow-auto items-start pt-[55px] pb-[20px] rounded-3xl border-[1px] border-gray-300 text-gray-400 shadow-md text-left relative -inset-y-[48px] z-10">
            {completion.map((res: {[key: string]: any}) => <SearchResult title={res["title"]} key={res["paperId"]}/>)}
          </ul> :
          null
      }
    </div>
    {/* <div className='h-[400px] w-full max-w-[700px] bg-red-200'></div> */}
  </>
}