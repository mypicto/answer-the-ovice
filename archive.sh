#!/bin/bash

current_dir="$(pwd)"
parent_dir="$(dirname "$current_dir")"
dir_name="$(basename "$current_dir")"
zip_name="${dir_name}.zip"

# 除外するファイルやディレクトリのパターンを定義
exclude_patterns=(
  "*/*archive.sh"
  "*/*.DS_Store"
  "*/*.git/*"
  "*/*.gitignore"
)

# 除外パターンを引数として渡す
exclude_args=""
for pattern in "${exclude_patterns[@]}"; do
  exclude_args+=" -x $pattern"
done

cd "$parent_dir" || exit
zip -r -X "$zip_name" "$dir_name" $exclude_args