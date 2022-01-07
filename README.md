[![Test build](https://img.shields.io/github/workflow/status/biaw/imagehost/Build%20and%20publish)](https://github.com/biaw/imagehost/actions/workflows/build-and-publish.yml)
[![Linting](https://img.shields.io/github/workflow/status/biaw/imagehost/Linting?label=quality)](https://github.com/biaw/imagehost/actions/workflows/linting.yml)
[![Analysis and Scans](https://img.shields.io/github/workflow/status/biaw/imagehost/Analysis%20and%20Scans?label=scan)](https://github.com/biaw/imagehost/actions/workflows/analysis-and-scans.yml)
[![Testing](https://img.shields.io/github/workflow/status/biaw/imagehost/Testing?label=tests)](https://github.com/biaw/imagehost/actions/workflows/testing.yml)
[![DeepScan grade](https://deepscan.io/api/teams/16173/projects/19610/branches/511873/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=16173&pid=19610&bid=511873)
[![express version](https://img.shields.io/github/package-json/dependency-version/biaw/imagehost/express)](https://www.npmjs.com/package/express)
[![GitHub Issues](https://img.shields.io/github/issues-raw/biaw/imagehost.svg)](https://github.com/biaw/imagehost/issues)
[![GitHub Pull Requests](https://img.shields.io/github/issues-pr-raw/biaw/imagehost.svg)](https://github.com/biaw/imagehost/pulls)

# imagehost

A simple express file uploader used as an image hosting service.

## Setup

### Setting up using Docker

With Docker, you don't even need to download anything. You can also slightly customize the behaviour by filling in environment variables. See the [`example.env`](https://github.com/biaw/imagehost/blob/master/example.env)-file for more information on what you can customize.

* `-p YOUR_PORT:80` - The Docker image runs on port 80, but you can redirect it to whatever port you want
* `-e "TOKEN=yoursecrettoken"` - To upload via e.g. ShareX, you need an authorization header with the token. Edit it to what you'd like to use.
* `-v /path/to/images:/app/images` - You need an image folder for your images. Define the path here.
* `-v /path/to/logs:/app/logs` - Logs are optional, but will help you debug. Omit this if you don't need logs.

#### Linux

```cmd
docker run --name imagehost \
  -p 1234:80 \
  -e "TOKEN=yoursecrettoken" \
  -v /imagehost/images:/app/images \
  -v /imagehost/logs:/app/logs \
  promisesolutions/imagehost:latest
```

#### Windows

```cmd
docker run --name imagehost ^
  -p 1234:80 ^
  -e "TOKEN=yoursecrettoken" ^
  -v "C:\imagehost\images":/app/images ^
  -v "C:\imagehost\logs":/app/logs ^
  promisesolutions/imagehost:latest
```
