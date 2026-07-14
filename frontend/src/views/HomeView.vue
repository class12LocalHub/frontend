<template>
  <div class="home">

    <!-- 소개 영역 -->
    <section class="hero">
      <h1>
        LocalHub
      </h1>

      <p>
        서울의 관광·문화·생활 정보를 한 곳에서 확인하세요.
      </p>
    </section>


    <!-- 카테고리 -->
    <section class="category-section">

      <h2>
        지역 정보
      </h2>


      <div class="categories">

        <div class="card">
          관광지
        </div>

        <div class="card">
          레포츠
        </div>

        <div class="card">
          문화시설
        </div>

        <div class="card">
          쇼핑
        </div>

        <div class="card">
          숙박
        </div>

        <div class="card">
          여행코스
        </div>

        <div class="card">
          축제공연행사
        </div>

      </div>

    </section>


    <!-- 게시글 영역 -->
    <section class="posts">

      <h2>
        최근 게시글
      </h2>


      <div class="post-box">
        아직 등록된 게시글이 없습니다.
      </div>

    </section>


  </div>
</template>


<style scoped>

.home {
  padding: 40px;
}


.hero {
  text-align: center;
  padding: 60px 0;
}


.hero h1 {
  font-size: 48px;
}


.category-section {
  margin-top: 40px;
}


.categories {

  display: flex;
  flex-wrap: wrap;

  gap: 20px;

}


.card {

  width: 150px;
  height: 100px;

  display: flex;
  justify-content: center;
  align-items: center;


  background: #f1f5f9;

  border-radius: 12px;

  cursor: pointer;

}


.posts {

  margin-top: 60px;

}


.post-box {

  padding: 30px;

  border: 1px solid #ddd;

  border-radius: 10px;

}

</style>