import axios from 'axios'


const API_URL = 'http://localhost:8000/api/chat'



export function sendChatMessage(message){

  return axios.post(

    API_URL,

    {
      message:message
    }

  )

}