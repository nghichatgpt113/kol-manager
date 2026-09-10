import sys
import json
from inspect_excel import parse_excel

def main():
    filename = 'WKF Nguyên Anh.xlsx'
    if len(sys.argv) > 1:
        filename = sys.argv[1]
    data = parse_excel(filename)
    json.dump(data, sys.stdout, ensure_ascii=False)

if __name__ == '__main__':
    main()
