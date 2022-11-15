import chalk from "chalk";
import commandLineArgs from "command-line-args";
import glob from "glob";
import expandTilde from "expand-tilde";
import { load } from "cheerio";
import fs from "fs";

const optionDefinitions = [
  { name: "articlesRoot", type: String, defaultOption: true },
];
const blockList = ['body', 'html', 'head'];

const unescapeHTML = (escapedHTML) => {
  return escapedHTML
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
};

export const findTags = (file) => {
  console.log(`Parsing ${file}`);
  const fileContents = fs.readFileSync(file, "utf8");
  let $ = load(fileContents);
  const contentBody = $("content-body");
  if (!contentBody.length) {
    console.log("File is not an article, skipping...");
    return;
  }
  $ = load(unescapeHTML(contentBody.html()));
  return $("*");
}

export const cli = () => {
  const articlesRoot = expandTilde(
    commandLineArgs(optionDefinitions).articlesRoot
  );
  if (!articlesRoot) {
    console.log("The articlesRoot parameter must be provided.");
    process.exit(1);
  }
  console.log(chalk.magenta(`Parsing articles in ${articlesRoot}...`));
  var sourceFiles = glob.sync(`${articlesRoot}/*.xml`);
  console.log(sourceFiles);

  const allKnownTags = [];
  sourceFiles.forEach((file) => {
    const tags = findTags(file);
    tags?.each((_, tag) => {
      const currentTagName = tag.name;
      if (blockList.includes(currentTagName)) {
        console.log('Tag is on the blocklist, ignoring it');
        return;
      }
      const existingTag = allKnownTags.find(
        (tag) => tag.name === currentTagName
      );
      if (existingTag) {
        console.log(
          chalk.greenBright(
            `Found instance of known tag ${currentTagName}, current count is ${
              existingTag.count + 1
            }`
          )
        );
        existingTag.count += 1;
      } else {
        console.log(chalk.redBright(`Found new tag ${currentTagName}.`));
        allKnownTags.push({ name: currentTagName, count: 1 });
      }
    });
  });
  console.log(chalk.magenta(`Scanning complete!`));
  console.log(allKnownTags);
};
