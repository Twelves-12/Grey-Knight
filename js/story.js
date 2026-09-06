const passages = [...document.querySelectorAll(".story-passage")];
const back = document.querySelector("#story-back");
const next = document.querySelector("#story-next");
const enter = document.querySelector("#story-enter");
const progress = document.querySelector("#story-progress");
let current = 0;

function showPassage() {
  for (const [index, passage] of passages.entries()) {
    passage.hidden = index !== current;
  }
  back.disabled = current === 0;
  next.hidden = current === passages.length - 1;
  enter.hidden = !next.hidden;
  progress.textContent = `${String(current + 1).padStart(2, "0")} / ${String(passages.length).padStart(2, "0")}`;
  passages[current].querySelector("h1").focus({ preventScroll: true });
}

back.addEventListener("click", () => {
  current -= 1;
  showPassage();
});
next.addEventListener("click", () => {
  current += 1;
  showPassage();
});
