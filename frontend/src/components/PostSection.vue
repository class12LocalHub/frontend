<template>
  <section
    id="posts"
    class="post-section"
  >

    <!-- 제목 영역 -->
    <div class="title-area">

      <h2>
        지역 게시판
      </h2>

      <button
        class="write-button"
        @click="showForm = !showForm"
      >
        글쓰기
      </button>

    </div>


    <!-- 게시글 작성 -->
    <div
      v-if="showForm"
      class="write-form"
    >

      <input
        v-model="newPost.title"
        placeholder="제목"
      />


      <select v-model="newPost.category">

        <option>
          관광지
        </option>

        <option>
          레포츠
        </option>

        <option>
          문화시설
        </option>

        <option>
          쇼핑
        </option>

        <option>
          숙박
        </option>

        <option>
          여행코스
        </option>

        <option>
          축제공연행사
        </option>

      </select>


      <textarea
        v-model="newPost.content"
        placeholder="내용"
      />


      <input
        v-model="newPost.password"
        type="password"
        placeholder="수정/삭제 비밀번호"
      />


      <button
        @click="addPost"
      >
        등록
      </button>

    </div>



    <!-- 게시글 목록 -->
    <div class="post-list">


      <div
        v-for="post in posts"
        :key="post.id"
        class="post-card"
      >

        <h3>
          {{ post.title }}
        </h3>


        <span>
          {{ post.category }}
        </span>


        <p>
          {{ post.content }}
        </p>


        <div class="actions">

          <button
            @click="openPassword(post)"
          >
            수정/삭제
          </button>

        </div>


      </div>


    </div>



    <!-- 비밀번호 확인 -->
    <div
      v-if="selectedPost"
      class="password-box"
    >

      <h3>
        비밀번호 확인
      </h3>


      <input
        v-model="passwordInput"
        type="password"
        placeholder="비밀번호"
      />


      <button
        @click="editPost"
      >
        수정
      </button>


      <button
        @click="deletePost"
      >
        삭제
      </button>


      <button
        @click="selectedPost = null"
      >
        취소
      </button>


    </div>


  </section>
</template>



<script setup>

import { ref } from 'vue'



// 작성 폼 표시 여부
const showForm = ref(false)



// 선택한 게시글
const selectedPost = ref(null)



// 입력한 비밀번호
const passwordInput = ref('')



// 게시글 데이터
const posts = ref([

  {
    id: 1,
    title: '서울숲 방문 후기',
    category: '관광지',
    content: '서울숲에 다녀온 후기입니다.',
    password: '1234'
  },


  {
    id: 2,
    title: '한강 레포츠 추천',
    category: '레포츠',
    content: '한강에서 즐길 수 있는 활동입니다.',
    password: '1234'
  }

])



// 새 게시글
const newPost = ref({

  title: '',
  category: '관광지',
  content: '',
  password: ''

})



// 게시글 등록
function addPost(){

  if(
    !newPost.value.title ||
    !newPost.value.content ||
    !newPost.value.password
  ){

    alert('모든 항목을 입력해주세요.')

    return

  }


  posts.value.push({

    id: Date.now(),

    title: newPost.value.title,

    category: newPost.value.category,

    content: newPost.value.content,

    password: newPost.value.password

  })


  newPost.value = {

    title: '',
    category: '관광지',
    content: '',
    password: ''

  }


  showForm.value = false

}



// 비밀번호 입력 열기
function openPassword(post){

  selectedPost.value = post

  passwordInput.value = ''

}



// 삭제
function deletePost(){

  if(
    passwordInput.value !== selectedPost.value.password
  ){

    alert('비밀번호가 틀렸습니다.')

    return

  }


  posts.value = posts.value.filter(

    post => post.id !== selectedPost.value.id

  )


  selectedPost.value = null

}



// 수정
function editPost(){

  if(
    passwordInput.value !== selectedPost.value.password
  ){

    alert('비밀번호가 틀렸습니다.')

    return

  }



  const title = prompt(
    '수정할 제목',
    selectedPost.value.title
  )



  const content = prompt(
    '수정할 내용',
    selectedPost.value.content
  )



  if(title){

    selectedPost.value.title = title

  }


  if(content){

    selectedPost.value.content = content

  }



  selectedPost.value = null

}


</script>



<style scoped>

.post-section {

  padding:80px 40px;

}



.title-area {

  display:flex;

  justify-content:space-between;

  align-items:center;

}



.title-area h2 {

  font-size:32px;

}



.write-button {

  padding:12px 20px;

  border:none;

  border-radius:8px;

  background:#2563eb;

  color:white;

  cursor:pointer;

}



.write-form {

  margin:30px 0;

  display:flex;

  flex-direction:column;

  gap:10px;

}



.write-form input,
.write-form textarea,
.write-form select {

  padding:10px;

}



.write-form textarea {

  height:120px;

}



.post-list {

  display:flex;

  flex-direction:column;

  gap:20px;

}



.post-card {

  padding:25px;

  border:1px solid #ddd;

  border-radius:12px;

}



.post-card span {

  color:#2563eb;

  font-size:14px;

}



.actions {

  margin-top:20px;

}



.actions button {

  padding:8px 15px;

}



.password-box {

  margin-top:30px;

  padding:20px;

  border:1px solid #ddd;

  border-radius:12px;

}



.password-box input {

  padding:10px;

  margin-right:10px;

}


.password-box button {

  margin-right:10px;

  padding:10px 15px;

}


</style>