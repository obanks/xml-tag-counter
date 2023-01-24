import chalk from "chalk";
import commandLineArgs from "command-line-args";
import glob from "glob";
import expandTilde from "expand-tilde";
import { load } from "cheerio";
import fs from "fs";
import util from "util";

const optionDefinitions = [
  { name: "articlesRoot", type: String, defaultOption: true },
];
const blockList = ["body", "html", "head"];

const unescapeHTML = (escapedHTML) => {
  return escapedHTML
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
};

export const findTags = (file) => {};

const getFileName = (filePath) => filePath.replace(/^.*[\\\/]/, "");

const regexRiddle = /^https?:\/\/www\.riddle.com/;
const regexYoutube = /^https?:\/\/www\.youtube.com/;
const regexTwitter = /^https?:\/\/(?:www\.)?twitter.com/;
const regexInstagram = /^https?:\/\/www\.instagram.com/;

export const cli = () => {
  const articlesRoot = expandTilde(
    commandLineArgs(optionDefinitions).articlesRoot
  );
  if (!articlesRoot) {
    console.log("The articlesRoot parameter must be provided.");
    process.exit(1);
  }
  // console.log(chalk.magenta(`Parsing articles in ${articlesRoot}...`));
  var sourceFiles = glob.sync(`${articlesRoot}/*.xml`);
  // console.log(sourceFiles);
  const embeds = [];

  sourceFiles.forEach((file) => {
    // console.log(`Parsing ${file}`);
    const fileContents = fs.readFileSync(file, "utf8");
    let $ = load(unescapeHTML(fileContents));
    const contentBody = $("content-body");
    if (!contentBody.length) {
      // console.log("File is not an article, skipping...");
      return;
    }
    const filename = file
    .toString()
    .substring(file.toString().lastIndexOf("/") + 1);
    const fileEntries = {
      filename,
      youtube: 0,
      twitter: 0,
      instagram: 0,
      riddle: 0,
    };
    // console.log("scanning", file);
    contentBody.children().map((_, element) => {
      const elementText = $(element).text();
      // console.log("testing node..", elementText);
      if (regexYoutube.test(elementText)) {
        fileEntries.youtube++;
      } else if (regexTwitter.test(elementText)) {
        fileEntries.twitter++;
      } else if (regexInstagram.test(elementText)) {
        fileEntries.instagram++;
      } else if (regexRiddle.test(elementText)) {
        fileEntries.riddle++;
      }
    });
    embeds.push(fileEntries);
  });
  console.log(chalk.magenta(`Scanning complete!`));
  console.log("Embeds found:");
  console.log(JSON.stringify(embeds));
  fs.writeFileSync('./data.json', JSON.stringify(embeds) , 'utf-8');
  // console.log("Files containing Youtube embeds: ", youtubeEmbedFiles.size);
  // console.log(youtubeEmbedFiles);
  // console.log("Files containing Twitter embeds: ", twitterEmbedFiles.size);
  // console.log(twitterEmbedFiles);
  // console.log("Files containing Riddle embeds: ", riddleEmbedFiles.size);
  // console.log(riddleEmbedFiles);
};
