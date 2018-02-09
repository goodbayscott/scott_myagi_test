# -*- mode: ruby -*-
# vi: set ft=ruby :

##
# To use this Vagrantfile, you will need ansible installed
# (`brew install ansible`) and the myagi infrastructure repo
# in a folder which is a sibling of this one.
##

begin
  ansible_version = %x[ansible --version].split(' ')[1]
  if ansible_version != "2.3.2.0"
    abort "Your ansible version should match the requirements.txt of the infrastructure repo"
  end
rescue
  abort 'Ansible not installed. Please run `pip install ansible`.'
end

ANSIBLE_PLAYBOOK = "./infrastructure/ansible/src/dev.yml"

Vagrant.configure("2") do |config|

  # Install required plugins
  required_plugins = %w( vagrant-share )
  required_plugins.each do |plugin|
    system "vagrant plugin install #{plugin}" unless Vagrant.has_plugin? plugin
  end

  # Development box definition
  config.vm.define :development do |dev|
      dev.vm.box = "ubuntu/trusty64"

      # Figure out memory and CPUs for box
      # From https://stefanwrobel.com/how-to-make-vagrant-performance-not-suck
      host = RbConfig::CONFIG['host_os']
      # Give VM 1/4 system memory & access to all cpu cores on the host
      if host =~ /darwin/
        cpus = `sysctl -n hw.ncpu`.to_i
        # sysctl returns Bytes and we need to convert to MB
        mem = `sysctl -n hw.memsize`.to_i / 1024 / 1024 / 4
      elsif host =~ /linux/
        cpus = `nproc`.to_i
        # meminfo shows KB and we need to convert to MB
        mem = `grep 'MemTotal' /proc/meminfo | sed -e 's/MemTotal://' -e 's/ kB//'`.to_i / 1024 / 4
      else # sorry Windows folks, I can't help you
        cpus = 2
        mem = 1024
      end

      dev.vm.provider :virtualbox do |vb|
        vb.customize ["modifyvm", :id, "--memory", mem, "--cpus", cpus]
      end

      # Required for NFS
      dev.vm.network "private_network", type: "dhcp"

      # Mount development directory using NFS by default
      dev.vm.synced_folder ".",
        "/home/myagi/src/",
        :nfs => true

      # Disable default synced folder to avoid confusion
      dev.vm.synced_folder ".", "/vagrant", disabled: true

      # Forward ports for nginx
      dev.vm.network :forwarded_port, guest: 80, host: 8080

      # Forward ports for django server
      dev.vm.network :forwarded_port, guest: 8000, host: 8000

      # Forward ports for ipython notebook
      dev.vm.network :forwarded_port, guest: 8889 , host: 8889

      # Forward ports for swampdragon server
      dev.vm.network :forwarded_port, guest: 9999, host: 9999

      # Forward ports for postgres
      # NOTE: You will still need to allow remote connections using
      # the guide here http://blog.bigbinary.com/2016/01/23/configure-postgresql-to-allow-remote-connection.html.
      dev.vm.network :forwarded_port, guest: 5555, host: 5555
      dev.vm.network :forwarded_port, guest: 5432, host: 5432

      # Forward ports for caravel
      dev.vm.network :forwarded_port, guest: 8088, host: 8088

      # Forward ports for livereload
      # dev.vm.network :forwarded_port, guest: 35729, host: 35729

      # Set hostname
      dev.vm.hostname = "development-web"

      # Set up gitconfig
      config.vm.provision "file", source: "~/.gitconfig", destination: "~/.gitconfig", :run => "always"

      # Allow for SSHing into other machines from within vagrant machine
      dev.ssh.forward_agent = true

      # Write out common bash_profile
      bash_profile = [
        # Include system bash profile
        'source /home/vagrant/.sys_bash_profile > /dev/null 2>&1',
        # Path
        'PATH=$PATH:$HOME/node_modules/less/bin',
        # Env vars
        'export APP_CONTAINER=/home/myagi',
        'export APP=$APP_CONTAINER/src',
        'export PYTHONIOENCODING=UTF-8',
        # Useful aliases
        'alias cd-container="cd $APP_CONTAINER"',
        'alias cd-app="cd $APP"',
        'alias activate="source $APP_CONTAINER/venv/bin/activate"',
        'alias rs="python manage.py runserver 0.0.0.0:8000"',
        'alias m="python manage.py"',
        'alias start-elasticsearch="sudo /etc/init.d/elasticsearch-es-01 start"',
        # Shortcuts for installing and uninstall npm packages
        'function npm-install { ',
        '    npm install --prefix /opt/lib/node_modules $1 $2 && npm shrinkwrap && ln -s /opt/lib/node_modules /srv/apps/development/worktree/frontend/node_modules',
        '}',
        'function npm-uninstall { ',
        '    npm uninstall --save $1 && npm shrinkwrap',
        '}',
        # Activate python venv and change to main project directory
        'activate',
        'cd-app',
        'cd myagi',

      ]

      command = "rm --force /home/vagrant/.bash_profile"
      dev.vm.provision :shell, :inline => command, :run => "always"

      bash_profile.each do |line|
        command = "echo -e '#{line}' >> /home/vagrant/.bash_profile"
        dev.vm.provision :shell, :inline => command, :run => "always"
      end

      # Sync system bash_profile for convenience
      dev.vm.provision "file", source: "~/.bash_profile", destination: "~/.sys_bash_profile", :run => "always"

      # Sync system ssh key
      dev.vm.provision "file", source: "~/.ssh/id_rsa", destination: "~/.ssh/id_rsa", :run => "always"
      dev.vm.provision :shell, :inline => "chmod 600 /home/vagrant/.ssh/id_rsa", :run => "always"

      # Ensure hostname gets set via Ansible always,
      # otherwise machine won't work properly when it first boots.
      dev.vm.provision "ansible", :run => "always" do |ansible|
        ansible.verbose = "v"
        ansible.tags = 'set_hostname'
        ansible.playbook = ANSIBLE_PLAYBOOK
      end

      # Configure using ansible. This is only
      # done if the "provision" flag is passed
      dev.vm.provision "ansible" do |ansible|
        ansible.verbose = "v"
        ansible.playbook = ANSIBLE_PLAYBOOK
      end

      # Make sure all python deps are installed
      command = "/home/myagi/venv/bin/activate && cd /home/myagi/src/myagi && /home/myagi/venv/bin/pip install -r requirements/development.txt"
      dev.vm.provision :shell, :inline => command

      # Kills gunicorn and celery.
      # These can be started manually if necessary, but they hog resources.
      command = "supervisorctl stop all"
      begin
        dev.vm.provision :shell, :inline => command, :run => "always"
      rescue
      end

  end

end
