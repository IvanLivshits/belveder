import "@belvedere/ui-kit/base.css";
import { render } from "preact";
import { App } from "./App";
import { initTelegram } from "./telegram";

initTelegram();
render(<App />, document.getElementById("app")!);
