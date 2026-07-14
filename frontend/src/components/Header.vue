<template>

<header class="header">


<div class="logo">

LocalHub

</div>



<nav>


<RouterLink to="/">
홈
</RouterLink>


<RouterLink to="/posts">
게시판
</RouterLink>


<RouterLink to="/dashboard">
대시보드
</RouterLink>


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


.router-link-active {

color:#2563eb;

font-weight:bold;

}

</style>