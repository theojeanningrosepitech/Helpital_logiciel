#!/bin/bash

DOCKER_NAMESPACE="helpital"
USAGE="\r\n📋 Usage:\t./script.sh <command> [arguments]\r\n\r\nThe commands are:\r\n\tbuild services\r\n\tstart\t\tlaunch services\r\n\tstop\t\tstop services\r\n\tlog\t\tdisplay container logs\r\n\trestart\t\trestart container\r\n\r\nThe arguments are:\r\n\t-node\t\tOnly affect NodeJs service\r\n\t-sql\t\tOnly affect Postgres service\r\n\t-test\t\tOnly affect test database\r\n"

if [ $# -eq 0 ]; then
    echo -e $USAGE
else
    if [ $1 == "build" -o $1 == "start" -o $1 == "restart" -o $1 == "stop" -o $1 == "log" ]; then
        for ac in $@
        do
            if [ $ac == "-node" ]; then
                onlyNode=true
            elif [ $ac == "-sql" ]; then
                onlySQL=true
            elif [ $ac == "-test" ]; then
                onlyTest=true
            elif [ $ac != $1 ]; then
                echo -e $USAGE
                exit 1
            fi

            DOCKER_CMD="docker-compose -f docker-compose.yaml -p $DOCKER_NAMESPACE"
        done

        if [ $1 == "build" ]; then
            if [ $onlySQL ]; then
                echo -e "Building..."
                $DOCKER_CMD build database
            elif [ $onlyTest ]; then
                echo -e "Building..."
                $DOCKER_CMD build database_test
            elif [ $onlyNode ]; then
                echo -e "Building..."
                $DOCKER_CMD build server
            else
                echo -e "Building..."
                $DOCKER_CMD build
            fi
            echo -e "Done"

        elif [ $1 == "start" ]; then
            if [ $onlySQL ]; then
                $DOCKER_CMD up -d database
            elif [ $onlyTest ]; then
                $DOCKER_CMD up -d database_test
            elif [ $onlyNode ]; then
                $DOCKER_CMD up -d server
            else
                $DOCKER_CMD up -d database; $DOCKER_CMD up -d server
            fi

        elif [ $1 == "stop" ]; then
            if [ $onlySQL ]; then
                $DOCKER_CMD stop database
            elif [ $onlyTest ]; then
                $DOCKER_CMD stop database_test
            elif [ $onlyNode ]; then
                $DOCKER_CMD stop server
            else
                $DOCKER_CMD stop
            fi

        elif [ $1 == "log" ]; then
            if [ $onlySQL ]; then
                $DOCKER_CMD logs database
            elif [ $onlyTest ]; then
                $DOCKER_CMD logs database_test
            elif [ $onlyNode ]; then
                $DOCKER_CMD logs server
            fi

        elif [ $1 == "restart" ]; then
            if [ $onlySQL ]; then
                $DOCKER_CMD stop database; $DOCKER_CMD up -d database
            elif [ $onlyTest ]; then
                $DOCKER_CMD stop database_test; $DOCKER_CMD up -d database_test
            elif [ $onlyNode ]; then
                $DOCKER_CMD stop server; $DOCKER_CMD up -d server
            else
                $DOCKER_CMD stop server; $DOCKER_CMD stop database;
		rm -rf ./docker-helpital/postgres/db-data/*;
                $DOCKER_CMD up -d database;
		$DOCKER_CMD build server;
		$DOCKER_CMD up -d server
            fi
        fi

    else
        echo -e $USAGE
    fi
fi
