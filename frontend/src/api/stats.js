import axios from 'axios'


const API_URL = 'http://localhost:8000/api/stats'



export function getStats(){

  return axios.get(API_URL)

}