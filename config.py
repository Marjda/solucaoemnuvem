import os

# Configurações do AWS S3
#AWS_ACCESS_KEY = os.environ('AWS_ACCESS_KEY')
#AWS_SECRET_KEY = os.environ('AWS_SECRET_KEY')
#S3_BUCKET = os.environ('S3_BUCKET')

# Configurações do MongoDB
MONGO_URI = os.environ.get('MONGODB_URI')  # URL da conexão do MongoDB
DATABASE_NAME = 'ubs_files'
COLLECTION_NAME = 'fs.files'
