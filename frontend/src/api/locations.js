import axios from 'axios'


const API_URL = 'http://localhost:8000/api/locations'



// 지역 정보 전체 조회
export function getLocations(){

  return axios.get(API_URL)

}



// 카테고리별 조회
export function getLocationsByCategory(category){

  return axios.get(
    `${API_URL}?category=${category}`
  )

}