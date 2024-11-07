import os
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from tqdm import tqdm
from fpdf import FPDF
p = "/Users/buenosnachos/Desktop/booz-allen-hamilton-backend/policies/PA"
if not os.path.isdir(p):
    os.mkdir(p)
head = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/112.0.0.0 Safari/537.36"
}
extensions = ['.pdf', '.doc', '.docx']
def get_soup(url):
    response = requests.get(url, headers=head)
    response.raise_for_status()
    return BeautifulSoup(response.text, 'html.parser')
def find_policy_links(url, soup):
    links = []
    refs = []
    for a_tag in soup.find_all('a', href=True):
        refs.append(a_tag['href'])
        href = a_tag['href']
        if any(href.lower().endswith(ext) for ext in extensions):
            full_url = urljoin(url, href)
            links.append(full_url)
    return links
def download_file(url, download_dir):
    local_filename = os.path.join(download_dir, url.split('/')[-1])
    with requests.get(url, headers=head, stream=True) as r:
        r.raise_for_status()
        if not os.path.isfile(local_filename):
            with open(local_filename, 'wb') as f:
                for chunk in r.iter_content(chunk_size=8192):
                    f.write(chunk)
    return local_filename
def find_chapter_links(url, soup):
    links = []
    for a_tag in soup.find_all('a', href=True, attrs={'name': "CHAPTER"}):
        href = a_tag['href']
        full_url = urljoin(url, href)
        links.append(full_url)
    return links
def find_subchapter_links(url, soup):
    links = []
    for a_tag in soup.find_all('a', href=True, attrs={'name': "SUBCHAPTER"}):
        href = a_tag['href']
        full_url = urljoin(url, href)
        links.append(full_url)
    return links
def find_section_links(url, soup):
    links = []
    for a_tag in soup.find_all('a', href=True, attrs={'name': "Section 249A.1"}):
        href = a_tag['href']
        full_url = urljoin(url, href)
        links.append(full_url)
    return links
def scrape_text_to_pdf(url, download_dir, head):
    main_soup = get_soup(url)
    chapter_links = find_chapter_links(url, main_soup)
    lst = []
    if len(chapter_links) != 0:
        count = 0
        for link in chapter_links:
            chapter_soup = get_soup(link)
            text = chapter_soup.get_text()
            chapter_title = chapter_soup.title.string.strip().replace(' ', '_').replace('/', '_')
            subchapter_links = find_subchapter_links(link, chapter_soup)
            
            for subchapter_link in subchapter_links:
                subchapter_soup = get_soup(subchapter_link)
                text = subchapter_soup.get_text()
                subchapter_title = subchapter_soup.title.string.strip().replace(' ', '_').replace('/', '_')
                print("SUBTITLE:", subchapter_title)
                pdf = FPDF()
                pdf.add_page()
                pdf.set_auto_page_break(auto=True, margin=15)
                pdf.set_font("Arial", size=12)
                for line in text.split('\n'):
                    if line.strip(): 
                        pdf.multi_cell(0, 10, line)
                
                pdf_filename = os.path.join(download_dir, f"{chapter_title}_{subchapter_title}_{count}.pdf")
                count += 1
                pdf.output(pdf_filename)
                lst.append(pdf_filename) 
    else:
        section_links = find_section_links(url, main_soup)
        print("SECTION LINKS:", len(section_links))
        count = 0
        for link in section_links:
            section_soup = get_soup(link)
            text = section_soup.get_text()
            section_title = section_soup.title.string.strip().replace(' ', '_').replace('/', '_')
            print("SECTION TITLE:", section_title)
            pdf = FPDF()
            pdf.add_page()
            pdf.set_auto_page_break(auto=True, margin=15)
            pdf.set_font("Arial", size=12)
            for line in text.split('\n'):
                if line.strip(): 
                    pdf.multi_cell(0, 10, line)
            
            pdf_filename = os.path.join(download_dir, f"{section_title}_{count}.pdf")
            count += 1
            pdf.output(pdf_filename)
            lst.append(pdf_filename)
        return lst
def scraper(full_link, short_link):
    soup = get_soup(full_link)
    links = find_policy_links(short_link, soup)
    if links:
        lst = []
        for link in links:
            lst.append(download_file(link, p))
        return lst
    else:
        return scrape_text_to_pdf(full_link, p, head)


    # try:
    #     print("main")
    #     soup = get_soup("https://www.pacodeandbulletin.gov/Display/pacode?titleNumber=055&file=/secure/pacode/data/055/055toc.html&searchunitkeywords=&operator=OR&title=null")
        
    #     print("policies")
    #     policy_links = find_policy_links("https://www.pacodeandbulletin.gov", soup)
        
    #     if not policy_links:
    #         print("No policy files")
    #         return
        
    #     print(f"{len(policy_links)} policies.")
        
    #     for link in tqdm(policy_links, desc="Downloading files"):
    #         try:
    #             download_file(link, p)
    #         except Exception as e:
    #             print(f"download error {link}: {e}")
        
    #     print(f"download done")
    
    # except Exception as e:
    #     print(f"{e}")

