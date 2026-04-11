from pathlib import Path
import subprocess
import sys
BASE = Path(__file__).resolve().parents[1]

def run(script_name: str) -> None:
    script = BASE / 'scripts' / script_name
    result = subprocess.run([sys.executable, str(script)], cwd=BASE)
    if result.returncode != 0:
        raise SystemExit(f'Failed at {script_name}')

if __name__ == '__main__':
    run('build_api.py')
    print('Pipeline completed successfully.')
