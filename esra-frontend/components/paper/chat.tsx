import { ExpandLess, ExpandMore, Search, Send, Mood, Person } from "@material-ui/icons"
import axios from "axios";
import Link from "next/link";
import { FunctionComponent, useState } from "react";



export const PaperChat = (props: any) => {
  const { paperId } = props;
  // const [isFocused, setIsFocused] = useState(false);
  const [text, setText] = useState("");
  const [chat, setChat] = useState([
    {text: 'Hello, How can I help you?', isResponse: true},
  ]);
  const [isSending, setIsSending] = useState(false);

  
  const handleText = (event: any) => {
    setText(event.target.value)
  }

  const sendChat = async (event: any) => {
    event.preventDefault();
    setIsSending(true);
    console.log("send:", text);
    const tempChat = [...chat];
    tempChat.push({text, isResponse:false});
    tempChat.push({text: "...", isResponse:true});
    setChat(tempChat);
    setText("");
    
    const origin = process.env.NEXT_PUBLIC_DEV_URL ?? (
      typeof window !== 'undefined' && window.location.origin
        ? new URL("api/", window.location.origin).toString()
        : '');
      
    const CHAT_URL = new URL('explain/chat', origin).toString();
    axios.get(CHAT_URL, { params: { query: text, paperId, wait: 30, gen: 1 } })
      .then(response => {
        console.log(response.data.result);
        console.log(tempChat);
        tempChat[tempChat.length - 1] = {text: response.data.result, isResponse:true}
        setChat(tempChat);
        console.log(tempChat);
        setIsSending(false);
      }).catch(error => {
        setIsSending(false);
        throw error;
      });
  }

  return <>
    <div className='flex flex-col w-[600px] h-full border-[1px] border-gray-300 p-3'>
      <div className='text-left ml-1 mb-3 text-lg font-semibold'>
        Chat
      </div>
      <div className='flex flex-col overflow-auto justify-start items-center h-full w-full'>
        {chat.map((e) => <PaperChatText text={e.text} isResponse={e.isResponse} />)}
      </div>
      <form 
        className='flex flex-row justify-center items-center h-16 w-full border-[1px] border-gray-300 rounded-full'
        onSubmit={sendChat}
      >
        <input
          className='ml-4 mx-5 text-gray-600 w-full focus:outline-none bg-transparent'
          type="text" 
          onChange={handleText}
          // onFocus={() => setIsFocused(true)}
          // onClick={() => setIsFocused(true)}
          value={text}
          placeholder="Ask something..."
        />
        <button 
          className={`flex flex-col items-start justify-center mr-2 ${text.length == 0 && !isSending ? 'text-gray-200' : 'text-gray-400'}`} 
          disabled={text.length === 0 && !isSending}
          onSubmit={sendChat}
        >
          <Send/>
        </button>
      </form>
    </div>
  </>
}

export const PaperChatText = (props: any) => {
  const { text, isResponse } = props;
  return <>
    <div className="flex flex-row w-full py-4 justify-center items-center border-b-[1px]">
      <div className="flex flex-row justify-center items-center w-10 h-full">
        {isResponse? <Mood/> : <Person/>}
      </div>
      <p className="w-full text-start">{text}</p>
    </div>

  </>

}