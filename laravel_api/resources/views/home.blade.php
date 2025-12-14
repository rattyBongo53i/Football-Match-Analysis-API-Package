@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row justify-content-center">
        <div class="col-md-8">
            <div class="card">
                <div class="card-header">{{ __('Dashboard') }}</div>

                <div class="card-body">
                             <div class="mb-6 rounded-lg border p-4
                                {{ $tableConnected ? 'bg-green-100 border-green-400 text-green-800' : 'bg-red-100 border-red-400 text-red-800' }}">
                                
                                {{ $tableConnected ? 'Table connected' : 'Table NOT connected' }}

                            </div>

                    @if (session('status'))
                        <div class="alert alert-success" role="alert">
                            {{ session('status') }}
                        </div>
                    @endif

                    {{ __('You are logged in!') }}
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
