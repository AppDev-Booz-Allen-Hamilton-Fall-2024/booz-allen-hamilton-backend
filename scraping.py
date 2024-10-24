import os
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from tqdm import tqdm

p = "/Users/rohan/booz_allen/booz-allen-hamilton-backend/policies/PA"
if not os.path.isdir(p):
    os.mkdir(p)
head = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/112.0.0.0 Safari/537.36"
}
extensions = ['.pdf', '.docx', '.xlsx', '.doc', '.txt', '.odt', '.tex', '.wpd']
def get_soup(url):
    response = requests.get(url, headers=head)
    response.raise_for_status()
    return BeautifulSoup(response.text, 'html.parser')
def find_policy_links(url, soup):
    links = []
    for a_tag in soup.find_all('a', href=True):
        href = a_tag['href']
        if any(href.lower().endswith(ext) for ext in extensions):
            full_url = urljoin(url, href)
            links.append(full_url)
    return links
def download_file(url, download_dir):
    local_filename = os.path.join(download_dir, url.split('/')[-1])
    with requests.get(url, headers=head, stream=True) as r:
        r.raise_for_status()
        with open(local_filename, 'wb') as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
    return local_filename
def main():
    try:
        print("main")
        soup = get_soup("https://www.pacodeandbulletin.gov/Display/pacode?titleNumber=055&file=/secure/pacode/data/055/055toc.html&searchunitkeywords=&operator=OR&title=null")
        
        print("policies")
        policy_links = find_policy_links("https://www.pacodeandbulletin.gov/", soup)
        
        if not policy_links:
            print("No policy files")
            return
        
        print(f"{len(policy_links)} policies.")
        
        for link in tqdm(policy_links, desc="Downloading files"):
            try:
                download_file(link, p)
            except Exception as e:
                print(f"download error {link}: {e}")
        
        print(f"download done")
    
    except Exception as e:
        print(f"{e}")

if __name__ == "__main__":
    main()

