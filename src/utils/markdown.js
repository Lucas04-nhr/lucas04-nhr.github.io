import MarkdownIt from "markdown-it";

const markdownParser = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

export default markdownParser;
