<template>
  <header class="header">

    <div class="logo">
      LocalHub
    </div>


    <nav>

      <a href="#home">
        홈
      </a>

      <a href="#posts">
        게시판
      </a>

      <a href="#dashboard">
        대시보드
      </a>

    </nav>

  </header>
</template>


<style scoped>

.header {

  height:70px;

  display:flex;

  justify-content:space-between;

  align-items:center;

  padding:0 40px;

  border-bottom:1px solid #ddd;

  position:sticky;

  top:0;

  background:white;

  z-index:10;

}


.logo {

  font-size:24px;

  font-weight:bold;

}


nav {

  display:flex;

  gap:20px;

}


a {

  text-decoration:none;

  color:black;

}


a:hover {

  color:#2563eb;

}

</style>