# Myagi 

[![Maintainability](https://api.codeclimate.com/v1/badges/6b1ccf0703b0be2478df/maintainability)](https://codeclimate.com/repos/59fba03a2339e902db0004c2/maintainability)

[![Test Coverage](https://api.codeclimate.com/v1/badges/6b1ccf0703b0be2478df/test_coverage)](https://codeclimate.com/repos/59fba03a2339e902db0004c2/test_coverage)

## Setting up a development environment

The easiest way to get set up is to use vagrant. Make sure you have vagrant installed using `brew install vagrant`. Also, make sure you have cloned the myagi puppetmaster repo into a directory adjacent to this repo. Then run `vagrant up development` to build the environment. This may take a little while, and could pause for lengthy periods of time depending on your internet connection. If any of the steps fail in the process, just run `vagrant reload development` to start it up again. Usually a couple of steps will fail along the way during the initial build, but reloading always fixes them (and will pretty much skip all the steps up until the failed one). 

Note: Running `vagrant up` without adding `development` will bring up the default machine, which you probably don't want. 

## Using the development environment 

Access the development machine by running `vagrant ssh development`. The `/srv/apps/development/worktree` directory is where the myagi_official repo lives, and this folder is synced with your local myagi_official repo. 

There are some handy commands added by default to the vagrant user bash_profile. Have a look in Vagrantfile to see what these are, and feel free to add more if they will be useful for other people. Also, your local bash_profile is synced with the vagrant user bash_profile, meaning any commands you use on your local machine will be available in the vagrant machine. 

One of the first things you'll want to do is load up a copy of the production database. Just `cd /srv/apps/development/worktree/myagi` and run `fab -R local load_prod_db -u {username on production machine}` to grab a copy and load it into your postgres database. This will overwrite any data you have in your local db if you ever run it again. Usually there will be a number of errors when you run the restore, these can usually be ignored. 

Once you've got a copy of the database, run the django server using `python manage.py runserver 0.0.0.0:8000` and visit `localhost:8000` in your browser to view the site. Alternatively, visit `localhost:8080` to view the site as served by nginx and gunicorn. 

## Fabric

Deploy to different environments using `fab -R {environment} deploy`, where environment is production or staging. Sync the staging database with production using `fab -R staging load_prod_db`, or sync your local database with production by running `fab -R local load_prod_db`.  

## Directory structure 

    myagi/                  
        * The main Django project.

    myagi/apps/             
        * All Django apps for myagi. 

    myagi/common/           
        * Any code which is shared between apps.
        * Any code which does not belong in any individual app (e.g. middleware and utils).

    myagi/data/             
        * Useful CSV and JSON files which have accumulated over time.

    myagi/fabfile/          
        * Definition of the fabfile which is used to deploy Myagi.

    myagi/log/              
        * Empty dir which can be used to hold log files which you do not want to be tracked.

    myagi/myagi/            
        * Settings and URL definitions for the project. 

    myagi/myagi/settings    
        * Contains settings files for different environments. The development_settings.py file is used by default. 
        * Add a local_settings.py file here to tailor settings further. 
        * Any settings which should be shared between environments go in base_settings.py. 

    myagi/requirements      
        * Requirements definitions for the different environments. 

    myagi/scripts/          
        * Any useful Python scripts. 

    myagi/static/           
        * Static files for Myagi.

    myagi/templates/        
        * Templates for Myagi. 
