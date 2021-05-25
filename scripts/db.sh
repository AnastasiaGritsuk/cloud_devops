#!/usr/bin/env bash

db=../data/users.db

reverse ()
{
    local line
    if IFS= read -r line
    then
        reverse
        printf '%s\n' "$line"
    fi
}

case $1 in
  add)
    read -p "Enter username: " username
    read -p "Enter role: " role

    if [ -z "$username" ] || [ -z "$role" ]
    then
      echo "Input cannot be blank. Please try again..."
      exit 0
    fi

    if ! [[ "$username" =~ [a-zA-Z] ]] || ! [[ "$role" =~ [a-zA-Z] ]]
    then
      echo "Input must contain only latin letters. Please try again..."
      exit 0
    fi

    entity="$username, $role"

    if [ -f "$db" ]
    then
      echo $entity>> $db
    else
      read -p "System must create the file. Please confirm, typing Y: " willCreate

      if [ "$willCreate" = Y ]
      then
        echo "File has been created"
        touch $db
        echo $entity>> $db

      else
        echo "Please create the file manually"
        exit 0

      fi
    fi
    ;;

  help)
    echo "Use this script with the following commands: "
    echo "add - to create new entity"
    echo "backup - to create the copy of the file"
    echo "find - find entity"
    echo "list - print entities in db"
    ;;
  "")
    echo "help"
    ;;
  backup)
    date=$(date +%F_%H-%M-%S)
    dir=../data/backup

    if ! [ -d $dir ]
    then
      mkdir $dir
    fi

    backupFile=$dir/$date-users.db.backup
    cp $db $backupFile
    ;;

  restore)
    files=../data/backup/*-users.db.backup

    if ! [ -f "$files" ]
    then
      echo "No backup file found"
      exit 0
    fi

    lastBackupFile=$(ls --sort=time $files -1 | head -n1)

    cp -f $lastBackupFile $db
    ;;

  find)
    read -p "Enter username: " username
    record=$(grep -e "^$username" $db)

    echo "$record"

    if [ -z "$record" ]
    then
      echo "User not found"
      exit 0
    fi
    ;;

  list)

    if [ "$2" == "inverse" ]
    then
      ./db.sh list | reverse
    else
      n=1
      while read line; do
      # reading each line
      echo "$n. $line"
      n=$((n+1))
      done < $db
    fi
    ;;

esac
