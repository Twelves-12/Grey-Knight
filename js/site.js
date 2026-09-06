import "./components/site-header.js";

const back = document.querySelector("#history-back");
if (back instanceof HTMLButtonElement) {
  back.onclick = () => history.back();
}
