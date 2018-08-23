<template>
  <div id="app">
    <BaseNav/>
    <flash-message class="flashpool"></flash-message>
    <router-view/>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
*,
.flashpool {
	box-sizing: border-box
}

.flashpool {
	position: fixed;
	top: 20px;
	right: 20px;
	max-height: 400px;
	width: 260px;
	-webkit-perspective: 400px;
	perspective: 400px;
  z-index: 100;
}

.flashpool .flash__message {
	width: 260px;
	transition: all .5s;
	display: -webkit-box;
	display: -ms-flexbox;
	display: flex;
	font-family: Oxygen, sans-serif;
	font-size: 13px;
	line-height: 130%
}

.flash-enter,
.flash-leave-to {
	opacity: 0;
	-webkit-transform: rotateX(-30deg) scale(.88) translateY(-30px);
	transform: rotateX(-30deg) scale(.88) translateY(-30px)
}

.flash-leave-active {
	position: absolute
}

.flash__message {
	box-sizing: border-box;
	padding: 15px 30px 15px 15px;
	margin-bottom: 10px;
	border: 1px solid transparent;
	border-radius: 4px;
	background-color: #ccc;
	position: relative
}

.flash__message.success {
	color: #3c763d;
	background-color: #dff0d8;
	border-color: #d6e9c6
}

.flash__message.warning {
	color: #8a6d3b;
	background-color: #fcf8e3;
	border-color: #faebcc
}

.flash__message.error {
	color: #a94442;
	background-color: #f2dede;
	border-color: #ebccd1
}

.flash__message.info {
	color: #37516a;
	background-color: #f2f5fe;
	border-color: #dfe3f0
}

.flash__close-button {
	box-sizing: border-box;
	position: absolute;
	top: 0;
	right: 0;
	color: inherit;
	-webkit-appearance: none;
	-moz-appearance: none;
	appearance: none;
	background-color: transparent;
	background: none;
	border: none;
	cursor: pointer;
	font-size: 18px;
	line-height: 10px;
	margin: 0;
	padding: 8px
}

.flash__close-button:active,
.flash__close-button:focus {
	outline: none
}
</style>
