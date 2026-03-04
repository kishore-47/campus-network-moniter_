import subprocess
import platform

ip = '8.8.8.8'
param = '-n' if platform.system().lower() == 'windows' else '-c'
command = ['ping', param, '1', ip]

try:
    output = subprocess.check_output(command, stderr=subprocess.STDOUT, universal_newlines=True, timeout=5)
    print("✅ PING WORKS!")
    print(output)
except Exception as e:
    print("❌ PING FAILED!")
    print(e)