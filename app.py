# Flask: O Flask é o framework que estamos usando para criar o servidor web.
# request: Esse módulo permite acessar dados das requisições, como arquivos ou dados enviados.
# jsonify: Usamos para retornar respostas no formato JSON (dados estruturados).
# send_file: Usado para enviar arquivos para o usuário.
# render_template: Carrega o arquivo HTML para exibir a página no navegador.
# secure_filename: Garante que o nome do arquivo enviado seja seguro (sem caracteres especiais).
# BytesIO: Permite manipular arquivos em memória, como se fossem arquivos normais.
# pymongo e gridfs: Usamos para conectar e trabalhar com o banco de dados MongoDB e para armazenar arquivos grandes usando GridFS.
# ObjectId: Utilizado para trabalhar com IDs do MongoDB, que são armazenados como objetos.
# config: Importa configurações, como a URL do MongoDB e o nome da base de dados e coleção.
from flask import Flask, request, jsonify, render_template
from werkzeug.utils import secure_filename
import pymongo
import gridfs
from config import MONGO_URI, DATABASE_NAME, COLLECTION_NAME

#================================================================================================================================================================================================================
# Flask: Cria uma instância do aplicativo Flask.
app = Flask(__name__)

#================================================================================================================================================================================================================
# Configurando MongoDB

# client: Conecta-se ao banco de dados MongoDB usando o MONGO_URI.
# db: Seleciona o banco de dados onde os arquivos e seus metadados serão armazenados.
# collection: Seleciona a coleção onde vamos guardar os metadados dos arquivos (informações como o nome do arquivo).
# bucket e fs: Configuram o GridFS, um sistema especial que o MongoDB usa para armazenar arquivos grandes.
client = pymongo.MongoClient(MONGO_URI)
db = client[DATABASE_NAME]
collection = db[COLLECTION_NAME]
bucket = gridfs.GridFSBucket(db)
fs = gridfs.GridFS(db)

#================================================================================================================================================================================================================
# Rota para a página principal

# @app.route('/'): Define a rota da página principal ("/"). Quando alguém acessa o site, essa função é executada.
# render_template('index.html'): Exibe a página index.html que está no diretório de templates. Esse arquivo HTML contém o frontend da aplicação (a interface que o usuário vê).
@app.route('/')
def index():
    return render_template('index.html')

#================================================================================================================================================================================================================
# Rota para fazer o upload do arquivo

# @app.route('/upload', methods=['POST']): Essa rota lida com o envio de arquivos. O método POST é usado porque estamos enviando dados.
# request.files: Verifica se algum arquivo foi enviado com o nome 'file'. Caso contrário, retorna um erro.
@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'Nenhum arquivo enviado'}), 400
    
    # file = request.files['file']: Pega o arquivo enviado.
    # file.filename == '': Verifica se o arquivo realmente tem um nome. Se estiver vazio, retorna um erro.
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Nenhum arquivo selecionado'}), 400
    
    if file:
        try:
            # secure_filename(file.filename): Converte o nome do arquivo para um formato seguro (sem caracteres especiais).
            # fs.put(file, ...): Salva o arquivo no GridFS.
            # file_id: Identificador único gerado pelo GridFS para esse arquivo.
            # file_metadata: Cria um dicionário para armazenar informações (metadados) sobre o arquivo, como o nome, tipo de conteúdo, e ID.
            # db.files_metadata.insert_one(file_metadata): Salva os metadados no banco de dados.
            # jsonify: Retorna uma resposta no formato JSON informando que o upload foi bem-sucedido.
            filename = secure_filename(file.filename)

            file_id = fs.put(file, filename=filename, content_type=file.content_type)

            # Salvando metadados no MongoDB
            file_metadata = {
                "filename": filename,
                "content_type": file.content_type,
                "file_id": file_id
            }

            db.files_metadata.insert_one(file_metadata)

            return jsonify({'message': 'Arquivo enviado com sucesso!', 'file_name': file_metadata['filename']}), 201
        except Exception as e:
            return jsonify({'error': str(e)}), 500

#================================================================================================================================================================================================================
# Rota para listar e filtrar arquivos

# @app.route('/files', methods=['GET']): Essa rota lida com a listagem dos arquivos. O método GET é usado para obter dados.
# file_type = request.args.get('type'): Obtém o tipo de arquivo da URL (se especificado). Isso permite filtrar os arquivos por tipo (ex: PDF, imagem).
# query: Cria um filtro. Se o tipo de arquivo for especificado, ele é adicionado ao filtro.
# collection.find(query): Busca todos os arquivos que correspondem ao filtro no MongoDB.
# file_list: Cria uma lista para armazenar os arquivos.
# file['_id'] = str(file['_id']): Converte o ID do arquivo (que é um ObjectId) para string, porque o ObjectId não pode ser facilmente enviado como JSON.
# jsonify(file_list): Retorna a lista de arquivos no formato JSON.
@app.route('/files', methods=['GET'])
def list_files():
    file_type = request.args.get('type')
    query = {}
    if file_type:
        query['content_type'] = file_type

    files = collection.find(query)
    file_list = []
    
    for file in files:
        file['_id'] = str(file['_id'])  # Converte ObjectId para string
        file_list.append(file)

    return jsonify(file_list), 200

#================================================================================================================================================================================================================
# Rota para baixar arquivos

# @app.route('/download/<filename>', methods=['GET']): Rota que permite baixar um arquivo pelo nome.
# bucket.open_download_stream_by_name(filename): Busca o arquivo no GridFS pelo nome.
# file.read(): Lê o conteúdo do arquivo.
# return contents: Retorna o conteúdo do arquivo para ser baixado pelo usuário.
# 404: Se o arquivo não for encontrado, retorna um erro de 404 (arquivo não encontrado).
@app.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    try:
        if (filename): 
            # Baixar o arquivo do GridFS
            file = bucket.open_download_stream_by_name(filename)
            contents = file.read()
            return contents
        return
    except Exception as e:
        return jsonify({'error': str(e)}), 404

if __name__ == '__main__':
    app.run(debug=True)
