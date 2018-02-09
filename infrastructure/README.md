Cloudformation
--------------
The cloudformation templates are designed to make the entire stack reproducible. To start up
a new stack, simply `cd` into the cloudformation directory and run `fab create_stack:stack_name`.
This is assuming you've added parameters into `cloudformation/stack.params.json` for the given `stack_name` and that you
have a file in `cloudformation/.aws_credentials` which contains a valid
AWS key. You can also update a stack using `fab update_stack:stack_name` when changes are
made to the cloudformation template (or parameters).

All the instances brought up by the cloudformation template (bastions, web servers, worker
servers etc) are able to configure themselves correctly. They do this by installing Ansible
using the relevant script in `cloudformation/bin/bootstrap`, and then running the Ansible
site.yml playbook locally. After initial configuration, the instances no longer configure
themselves and should instead be configured by running the Ansible playbooks when changes
are made. That is, they configure themselves initially by pulling configuration, but from
then on require configuration changes to be pushed to them.

It's also worth noting that the web servers and worker servers are part of auto scaling groups.
However, they do not currently deploy the Myagi codebase after configuring themselves.
Instead, you need to run a deployment to get them up and running. They will not be added to the
environment's load balancer until a deployment is complete (because the healthcheck performed
by the load balancer will fail).

NOTE - AWS stores the user data script in /var/lib/cloud/instance/user-data.txt. If servers
aren't configuring themselves correctly, then the best thing to do is log in to the server
(assuming you have the infrastructure.pem key) and run `sudo su`, then
`source /var/lib/cloud/instance/user-data.txt`. That will re-execute the bootstrapping
process (which should end with the server running the correct Ansible playbook against itself).
If anything is wrong in that process, you will be able to see what happened and debug.``

Alternatively, the user-data script logs to `/var/log/user-data.log`, so you should log in
and view that script to see what happened.


Ansible
-------
How a particular server is configured is determined by the tags attached to that server
by the cloudformation template. In particular, the `myagi_instance_type` tag is the determining
factor for which plays get run against a given server. As stated above, servers configure
themselves when they first come online. From then on, they should be configured by cd'ing into the
`ansible` directory and running `/bin/run <stack_name> [limiting_value]`, where stack_name is
`production` or `staging` and the optional limiting_value is something like `tag_myagi_instance_type_web`
(to only configure web servers). If no limiting_value is specified, then all servers in the stack
will be configured.
