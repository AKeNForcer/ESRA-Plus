import { Search } from "@material-ui/icons"
import { useEffect, useRef, useState } from "react";
import { SearchResult } from "./search-result";
import axios from 'axios';
import { useRouter } from "next/router";


export const SearchComponent = (props: any) => {
  const router = useRouter();
  
  // const { initialQuery, currPage } = props;
  const initialQuery = router.query.query;
  const [query, setQuery] = useState(initialQuery ?? "");
  const [completion, setCompletion] = useState<Array<{ [key: string]: any }>>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const [timeoutId, setTimeoutId] = useState<any>(null);
  
  useEffect(() => {
    console.log(`initialQuery changed: ${initialQuery}`);
    if (initialQuery) setQuery(initialQuery);
  }, [initialQuery]);

  const handleQuery = (event: any) => {
    const newQuery = event.target.value;
    setQuery(newQuery);

    if (isIdle) {
      setIsIdle(false);
    }
    clearTimeout(timeoutId);
    if (newQuery.length > 0) {
      setTimeoutId(setTimeout(() => {
        const COMPLETE_URL = new URL("/search/complete", process.env.NEXT_PUBLIC_BACKEND_URL).toString();
        setIsFocused(true);
        axios.get(COMPLETE_URL, { params: { query: newQuery } }).then(response => {
          setCompletion(response.data.result);
        });
        setIsIdle(true);
      }, 500));
    } else {
      setCompletion([]);
      setIsIdle(true);
    }

  }

  const ref = useRef<any>(null);
  useEffect(() => {
    function handleClickOutside(event: any) {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsFocused(false);
      }
    }
    function handleKeyDown(event: any) {
      if (event.key === "Escape") {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown, false);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown, false);
    };
  }, [ref]);


  const onSubmitSearch = (event: any) => {
    event.preventDefault();
    submitSearch(query.toString());
  }

  const submitSearch = (q: string) => {
    if (q.length == 0) return;
    setQuery(q);
    setIsFocused(false);
    router.push(`/search?query=${q}`)
  }

  return <>
    <div className='h-[400px] w-full max-w-[700px] text-base' ref={ref}> {/*absolute inset-y-[345px]  z-20*/}
      <div className={`flex-col h-12 w-full items-center bg-transparent rounded-3xl border-[1px] border-gray-300 relative z-30 ${isFocused && completion.length > 0 ? '' : 'focus-within:shadow-md hover:shadow-md'}`}>
        <div className="flex h-12 w-full items-center relative z-40">
          <form
            className="flex h-12 w-full items-center rounded-3xl text-gray-400 relative z-40"
            onSubmit={onSubmitSearch}
          >
            <Search className='ml-3' />
            <input
              className='ml-3 mx-5 text-gray-600 w-full focus:outline-none bg-transparent'
              type="text" onChange={handleQuery}
              onFocus={() => setIsFocused(true)}
              onClick={() => setIsFocused(true)}
              value={query}
              placeholder="serch by keyword or context"
            />
          </form>
        </div>
        {
          isFocused && completion.length > 0 ?
            <div className="flex h-6 w-full bg-white relative z-30 -inset-y-6">
              <div className="h-full w-full mx-3 border-b-[1px]" />
            </div> : null
        }
      </div>
      {
        isFocused && completion.length > 0 ?
          <div
            className="w-full shadow-md text-left relative -inset-y-[48px] z-20 bg-white rounded-3xl border-[1px] border-gray-300"
          >
            <ul className="flex flex-col h-auto w-full max-h-[415px] short:max-h-[360px] rxs:max-h-[360px] overflow-auto items-start mt-[45px] pt-[10px] mb-[20px] text-gray-400">
              {completion.map((res: { [key: string]: any }) => <SearchResult
                title={res["title"]} key={res["paperId"]} onSubmitClick={submitSearch} />)}
            </ul>
          </div> : null
      }
    </div>
  </>
}