import os
import machine

print("🗑️  PICO WORDT SCHOONGEMAAKT! 💨🔥")
print("=" * 50)
print("⚠️  ALLE BESTANDEN WORDEN VERWIJDERD! ⚠️")
print("=" * 50)

# List all files and delete them
try:
    files = os.listdir('/')
    for file in files:
        filepath = '/' + file
        try:
            # Check if it's a file or directory
            stat = os.stat(filepath)
            if stat[0] & 0x4000:  # Directory
                # Try to remove directory
                try:
                    os.rmdir(filepath)
                    print(f"📁 Map verwijderd: {file} ✅")
                except:
                    print(f"❌ Kon map niet verwijderen: {file}")
            else:
                # Remove file
                os.remove(filepath)
                print(f"📄 Bestand verwijderd: {file} ✅")
        except Exception as e:
            print(f"⚠️  Fout bij {file}: {e}")
    
    print("=" * 50)
    print("🎉 ALLE BESTANDEN VERWIJDERD! 🎉")
    print("=" * 50)
    print("🚀 Verwijder nu boot.py... 💥")
    print("=" * 50)
    
    # Remove boot.py
    try:
        os.remove('/boot.py')
        print("💯 boot.py VERNIETIGD! 🔥🔥🔥")
    except:
        print("⚠️  boot.py kon niet verwijderd worden")
    
    print("=" * 50)
    print("✨ PICO SCHOON! ALLES WEG! 🗑️✨")
    print("=" * 50)
    
except Exception as e:
    print(f"❌ KRITIEKE FOUT: {e} ❌")

print("\n🔌 Herstart de Pico om terug te beginnen! 🔌")
