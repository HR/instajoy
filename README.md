# InstaJ😂y

A NodeJS app made in less than 24hrs at the Facebook Hackathon 2018.

It visualises the ups and downs of your life by doing sentimental analysis on your instagram posts.
Gives you a happiness score that is based on how happy you have been with the aim of encouraging you to laugh 😂 more.

![InstaJoy screenshot](github/screenshot.png)

# Development

## Pre-requirements
Need the following environmental defined to run this. These can be defined in a `.env.json` file like so
```js
{
  "MS_FACE_API_KEY": [microsoft cognitive services face API key],
  "IG_CLIENT_ID": [instagram client id],
  "IG_CLIENT_SECRET": [instagram client secret]
}
```
## Run
After installing all the dependencies (`npm i`) just run
```sh
npm run dev
```
