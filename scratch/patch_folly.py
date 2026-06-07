import os
import stat

def patch_file(filepath):
    print(f"Checking: {filepath}")
    if os.path.islink(filepath):
        real_path = os.path.realpath(filepath)
        print(f"  Is a symlink pointing to: {real_path}")
        # Patch the real path instead
        filepath = real_path

    if not os.path.exists(filepath):
        print(f"  Error: path {filepath} does not exist.")
        return

    try:
        # Check permissions and make it writeable if needed
        file_stat = os.stat(filepath)
        if not bool(file_stat.st_mode & stat.S_IWRITE):
            print(f"  File is read-only. Making it writeable...")
            os.chmod(filepath, file_stat.st_mode | stat.S_IWRITE)

        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        target = '#if FOLLY_HAS_COROUTINES'
        if target in content:
            print(f"  Found '{target}' in {filepath}. Patching...")
            new_content = content.replace(target, '#if 0 // FOLLY_HAS_COROUTINES')
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print("  Successfully patched!")
        else:
            print("  Did not find target string (or already patched).")
    except Exception as e:
        print(f"  Failed to patch {filepath}: {e}")

def main():
    pods_dir = "/Users/abhijith.narayan/Downloads/cognify/ios/Pods"
    if not os.path.exists(pods_dir):
        print(f"Pods directory not found: {pods_dir}")
        return

    targets = ["Expected.h", "Optional.h"]
    for root, dirs, files in os.walk(pods_dir):
        for file in files:
            if file in targets:
                full_path = os.path.join(root, file)
                patch_file(full_path)

if __name__ == "__main__":
    main()
