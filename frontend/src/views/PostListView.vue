<template>
  <div class="post-page">

    <h1>
      지역 게시판
    </h1>


    <div class="toolbar">

      <select>
        <option>
          전체
        </option>

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


      <RouterLink to="/posts/write">
        글쓰기
      </RouterLink>

    </div>


    <div class="post-list">

      <div class="post-card">
        <h3>
          서울숲 방문 후기
        </h3>

        <p>
          관광지
        </p>
      </div>


      <div class="post-card">
        <h3>
          한강 레포츠 추천
        </h3>

        <p>
          레포츠
        </p>
      </div>


    </div>


  </div>
</template>


<style scoped>

.post-page {

  padding: 40px;

}


.toolbar {

  display:flex;
  justify-content:space-between;

  margin-bottom:30px;

}


.post-card {

  padding:20px;

  border:1px solid #ddd;

  border-radius:10px;

  margin-bottom:15px;

}

</style>