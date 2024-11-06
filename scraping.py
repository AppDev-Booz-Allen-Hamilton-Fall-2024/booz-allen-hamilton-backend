import os  # Importing the os module for interacting with the operating system
import requests  # Importing requests for making HTTP requests
from bs4 import BeautifulSoup  # Importing BeautifulSoup for parsing HTML content
from urllib.parse import urljoin  # Importing urljoin to construct absolute URLs
from tqdm import tqdm  # Importing tqdm for progress bars
from fpdf import FPDF  # Importing FPDF for creating PDF files

# Set the download directory path
p = "/Users/buenosnachos/Desktop/booz-allen-hamilton-backend/policies/PA"

# Create the download directory if it doesn't exist
if not os.path.isdir(p):
    os.mkdir(p)

# Define the headers for HTTP requests to mimic a browser
head = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/112.0.0.0 Safari/537.36"
}

# Define the list of file extensions to look for
extensions = ['.pdf', '.doc', '.docx']

def get_soup(url):
    """
    Fetches the content of the given URL and returns a BeautifulSoup object.
    
    :param url: The URL to scrape
    :return: BeautifulSoup object of the fetched HTML content
    """
    response = requests.get(url, headers=head)  # Make a GET request to the URL with headers
    response.raise_for_status()  # Raise an error for bad status codes
    return BeautifulSoup(response.text, 'html.parser')  # Parse and return the HTML content

def find_policy_links(url, soup):
    """
    Finds and returns all policy document links from the given BeautifulSoup object.
    
    :param url: The base URL to resolve relative links
    :param soup: BeautifulSoup object of the page content
    :return: List of absolute URLs to policy documents
    """
    links = []  # Initialize an empty list to store policy links
    refs = []  # Initialize an empty list to store all href references
    for a_tag in soup.find_all('a', href=True):  # Iterate over all anchor tags with href attributes
        refs.append(a_tag['href'])  # Append the href to refs list
        href = a_tag['href']
        if any(href.lower().endswith(ext) for ext in extensions):  # Check if href ends with desired extensions
            full_url = urljoin(url, href)  # Construct absolute URL
            links.append(full_url)  # Append the absolute URL to links list
    return links  # Return the list of policy document links

def download_file(url, download_dir):
    """
    Downloads a file from the given URL to the specified directory.
    
    :param url: The URL of the file to download
    :param download_dir: The directory where the file will be saved
    :return: Path to the downloaded file
    """
    local_filename = os.path.join(download_dir, url.split('/')[-1])  # Define the local file path
    with requests.get(url, headers=head, stream=True) as r:  # Stream the GET request
        r.raise_for_status()  # Raise an error for bad status codes
        if not os.path.isfile(local_filename):  # Check if file already exists
            with open(local_filename, 'wb') as f:  # Open the file in write-binary mode
                for chunk in r.iter_content(chunk_size=8192):  # Iterate over the response in chunks
                    f.write(chunk)  # Write each chunk to the file
    return local_filename  # Return the path to the 
