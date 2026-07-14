import axios from 'axios'


const API_URL = 'http://localhost:8000/api/posts'



// 게시글 목록 조회
export function getPosts(){

  return axios.get(API_URL)

}



// 게시글 상세 조회
export function getPost(id){

  return axios.get(
    `${API_URL}/${id}`
  )

}



// 게시글 작성
export function createPost(post){

  return axios.post(
    API_URL,
    post
  )

}



// 게시글 수정
export function updatePost(id, post){

  return axios.put(
    `${API_URL}/${id}`,
    post
  )

}



// 게시글 삭제
export function deletePost(id, password){

  return axios.delete(
    `${API_URL}/${id}`,
    {
      data:{
        password:password
      }
    }
  )

}