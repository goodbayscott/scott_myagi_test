# Myagi Public Site

## Overview

Our public facing website is built and maintained separately to our main app. We use Hugo
(gohugo.io) to generate the site from templates and content files contained in this folder.
The site is served from the same servers as our main app, with routing taken care of by nginx.

## Getting started

Install Hugo on your machine (http://gohugo.io/getting-started/installing/), then navigate
to this folder in your terminal and run `hugo server`. You should then be able to see the site
by visiting localhost:1313 in your browser. Have a read through the Hugo docs to understand
how everything works.

## Making changes

Most changes will take part in the `content` and the `layouts` folder. As the names suggest, `content`
is where all actual site text should live and `layouts` is where all the HTML templates which
contain that text should live. So if you want to make changes to site copy, you should only need
to make changes to files in the `content` folder, whereas if you want to reorganize the page you'll
need to make changes in the `layouts` folder (and potentially our `static/css/site.css` file).

The goal is to keep everything well organized, so try to make judicious use of partial templates
when adding or updating HTML. If you find yourself copying and pasting blocks of code multiple times,
it would be better to use a partial template.

## Deploying changes

For now, all changes should be made on a branch and then pushed to Github. Once reviewed,
a member of the dev team will be able to merge the changes and push them to the live site.

In future, we will likely be able to avoid involvement from the dev team, but that will require
a separate deploy process.
