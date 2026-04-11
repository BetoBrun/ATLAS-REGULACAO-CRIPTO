from pathlib import Path
import subprocess
import sys

BASE = Path(__file__).resolve().parents[1]

if __name__ == '__main__':
    script = BASE / 'scripts' / 'build_api.py'
    result = subprocess.run([sys.executable, str(script)], cwd=BASE)
    if result.returncode != 0:
        raise SystemExit('Pipeline failed')
    print('Pipeline completed successfully.')
